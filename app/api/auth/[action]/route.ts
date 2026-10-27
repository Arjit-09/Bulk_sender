import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import {
  createSession,
  failure,
  rateLimit,
  sameOrigin,
} from "@/lib/platform/auth";
import { hash, passwordHash, passwordMatches } from "@/lib/platform/crypto";
import { assert, field } from "@/lib/platform/policy";
export async function POST(
  req: Request,
  ctx: { params: Promise<{ action: string }> },
) {
  try {
    sameOrigin(req);
    const { action } = await ctx.params;
    if (action === "logout") {
      const jar = await cookies();
      const token = jar.get("pulse_session")?.value;
      if (token)
        await prisma.session.deleteMany({ where: { tokenHash: hash(token) } });
      jar.delete("pulse_session");
      return Response.json({ ok: true });
    }
    assert(["login", "register"].includes(action), "Unknown action.", 404);
    await rateLimit("auth:global", 100, 60);
    const data = await req.json();
    const email = field(data.email, "Email", 254).toLowerCase();
    assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), "Enter a valid email.");
    await rateLimit(`auth:${hash(email)}`, 10, 900);
    const password = field(data.password, "Password", 128);
    assert(
      password.length >= 12,
      "Use at least 12 characters for your password.",
    );
    if (action === "register") {
      assert(
        process.env.ALLOW_SIGNUP === "true",
        "Self-service signup is closed. Contact the platform owner.",
        403,
      );
      const name = field(data.name, "Your name");
      const organization = field(data.organization, "Organization");
      const passwordDigest = await passwordHash(password);
      const result = await prisma.$transaction(async (tx) => {
        assert(
          !(await tx.account.findUnique({ where: { email } })),
          "Unable to register this email. Try signing in.",
        );
        const account = await tx.account.create({
          data: { email, name, passwordHash: passwordDigest },
        });
        const workspace = await tx.workspace.create({
          data: {
            name: organization,
            members: { create: { accountId: account.id, role: "owner" } },
          },
        });
        return { account, workspace };
      });
      await createSession(result.account.id, result.workspace.id);
    } else {
      const account = await prisma.account.findUnique({
        where: { email },
        include: { memberships: true },
      });
      const dummy = "00000000000000000000000000000000:" + "00".repeat(64);
      const matches = await passwordMatches(
        password,
        account?.passwordHash || dummy,
      );
      assert(
        account && matches && account.memberships.length,
        "Email or password is incorrect.",
        401,
      );
      await createSession(account.id, account.memberships[0].workspaceId);
    }
    return Response.json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
