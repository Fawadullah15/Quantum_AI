export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  return new Response(`User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: ${origin}/sitemap.xml`, {
    headers: { 'Content-Type': 'text/plain' }
  })
}
