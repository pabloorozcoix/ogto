export async function POST(req: Request) {
  void req;
  return new Response(
    JSON.stringify({
      error: 'This endpoint has been removed. Use web_search pagination (start) instead.',
    }),
    { status: 410, headers: { 'Content-Type': 'application/json' } }
  );
}
