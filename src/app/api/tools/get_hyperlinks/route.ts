import { NextResponse } from "next/server";


export async function POST(req: Request) {
  const { url } = await req.json();
  
  
  return NextResponse.json({
    url,
    title: `Title for ${url}`,
    links: [
      { text: "Example Link", href: "https://example.com", title: "Example" },
    ],
    totalLinks: 1,
    fetchedAt: new Date().toISOString(),
  });
}
