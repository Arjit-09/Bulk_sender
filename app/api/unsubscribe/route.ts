import prisma from "@/lib/prisma";
import { validUnsubscribe } from "@/lib/platform/crypto";
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") || "";
  const token = url.searchParams.get("token") || "";
  if (!validUnsubscribe(id, token))
    return new Response("Invalid unsubscribe link.", { status: 400 });
  return new Response(
    '<!doctype html><html lang="en"><meta name="viewport" content="width=device-width"><title>Unsubscribe</title><body style="font:18px system-ui;max-width:500px;margin:80px auto;padding:24px"><h1>Manage your messages</h1><p>Stop receiving messages from this organization on this channel.</p><form method="POST"><button style="padding:14px 24px">Confirm unsubscribe</button></form></body></html>',
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Referrer-Policy": "no-referrer",
        "Cache-Control": "no-store",
      },
    },
  );
}
export async function POST(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") || "";
  const token = url.searchParams.get("token") || "";
  if (!validUnsubscribe(id, token))
    return new Response("Invalid unsubscribe link.", { status: 400 });
  await prisma.audienceContact.updateMany({
    where: { id },
    data: { unsubscribedAt: new Date() },
  });
  return new Response(
    "You have been unsubscribed. No further campaigns will be sent to this address on this channel.",
    { headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" } },
  );
}
