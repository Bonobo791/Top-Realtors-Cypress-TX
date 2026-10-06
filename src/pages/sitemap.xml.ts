import type { APIRoute } from 'astro';
import { getDirectory } from '../lib/content';
import { canonical } from '../lib/contracts';
export const GET: APIRoute = async () => {
  const { paths } = await getDirectory();
  return new Response(
    '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      paths
        .map((path) => '<url><loc>' + canonical(path) + '</loc></url>')
        .join('') +
      '</urlset>',
    { headers: { 'Content-Type': 'application/xml' } },
  );
};
