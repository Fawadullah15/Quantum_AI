export async function GET() {
  return new Response(`User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/sitemap.xml`, {
    headers: { 'Content-Type': 'text/plain' }
  })
}
