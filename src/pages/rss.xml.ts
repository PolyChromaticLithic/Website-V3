import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { SITE } from '../config';

/**
 * 本文の中の、サイト内を指すパス（/blog/... や /_astro/...）を絶対 URL にする。
 * フィードはリーダーの中で読まれるので、相対のままだとリンクも画像も切れる。
 */
const absolutize = (html: string, origin: string) =>
  html.replace(/(\s(?:href|src)=")\/(?!\/)/g, `$1${origin}/`);

export const GET: APIRoute = async (context) => {
  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.published.getTime() - a.data.published.getTime(),
  );
  const origin = (context.site?.href ?? SITE.origin).replace(/\/$/, '');

  return rss({
    title: SITE.name,
    description: SITE.tagline,
    site: context.site ?? SITE.origin,
    items: posts.map((post) => {
      // Markdown から作った HTML。glob ローダーが読み込み時に持たせている。
      const html = post.rendered?.html;
      return {
        title: post.data.title,
        description: post.data.summary,
        pubDate: post.data.published,
        link: `/blog/${post.id}/`,
        categories: [...post.data.tags],
        // 要約だけでなく本文も配る。リーダーの中で最後まで読める。
        ...(html ? { content: absolutize(html, origin) } : {}),
      };
    }),
    customData: `<language>ja</language>`,
  });
};
