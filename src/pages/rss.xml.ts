import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { SITE } from '../config';

export const GET: APIRoute = async (context) => {
  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.published.getTime() - a.data.published.getTime(),
  );

  return rss({
    title: SITE.name,
    description: SITE.tagline,
    site: context.site ?? SITE.origin,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.summary,
      pubDate: post.data.published,
      link: `/blog/${post.id}/`,
      categories: [...post.data.tags],
    })),
    customData: `<language>ja</language>`,
  });
};
