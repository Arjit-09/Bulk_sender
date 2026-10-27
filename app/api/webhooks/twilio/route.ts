export async function POST() {
  return Response.json(
    { error: "Legacy endpoint retired. Use the authenticated platform API." },
    { status: 410 },
  );
}
