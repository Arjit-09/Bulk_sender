import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import prisma from "@/lib/prisma";
import { hash } from "./crypto";
import { assert, canManage, HttpError } from "./policy";
export async function session() {
  const token = (await cookies()).get("pulse_session")?.value;
  assert(token, "Sign in to continue.", 401);
  const s = await prisma.session.findUnique({
    where: { tokenHash: hash(token) },
    include: { account: true },
  });
  assert(s && s.expiresAt > new Date(), "Your session has expired.", 401);
  const member = await prisma.membership.findUnique({
    where: {
      accountId_workspaceId: {
        accountId: s.accountId,
        workspaceId: s.workspaceId,
      },
    },
    include: { workspace: true },
  });
  assert(member, "Workspace access was revoked.", 403);
  assert(
    !member.workspace.suspended || s.account.superAdmin,
    "This workspace is suspended. Contact support.",
    403,
  );
  return {
    account: s.account,
    workspace: member.workspace,
    role: member.role,
    workspaceId: member.workspaceId,
  };
}
export function manager(role: string) {
  assert(canManage(role), "An owner or admin must perform this action.", 403);
}
export async function createSession(accountId: string, workspaceId: string) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 7 * 86400000);
  await prisma.session.create({
    data: {
      tokenHash: hash(token),
      accountId,
      workspaceId,
      expiresAt: expires,
    },
  });
  (await cookies()).set("pulse_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}
export function sameOrigin(req: Request) {
  const expected = process.env.APP_URL || new URL(req.url).origin;
  assert(
    req.headers.get("origin") === new URL(expected).origin,
    "Invalid request origin.",
    403,
  );
}
export async function rateLimit(key: string, limit: number, seconds = 60) {
  const bucket = `${key}:${Math.floor(Date.now() / (seconds * 1000))}`;
  const row = await prisma.rateBucket.upsert({
    where: { key: bucket },
    create: { key: bucket, expiresAt: new Date(Date.now() + seconds * 2000) },
    update: { count: { increment: 1 } },
  });
  assert(row.count <= limit, "Too many requests. Please try again later.", 429);
}
export function failure(error: unknown) {
  if (error instanceof HttpError)
    return Response.json({ error: error.message }, { status: error.status });
  if (typeof error === "object" && error && "code" in error) {
    if (error.code === "P2002")
      return Response.json(
        { error: "This record or sender identity already exists." },
        { status: 409 },
      );
    if (error.code === "P2034")
      return Response.json(
        {
          error:
            "Another request updated this workspace. Refresh and try again.",
        },
        { status: 409 },
      );
  }
  console.error(
    "Platform request failed",
    error instanceof Error ? error.name : "UnknownError",
  );
  return Response.json(
    {
      error:
        "The request could not be completed. Check the service configuration or try again.",
    },
    { status: 503 },
  );
}
