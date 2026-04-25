import type { MetadataRoute } from "next";

const BASE_URL = "https://furrcircle.com";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

async function getCommunityIds(): Promise<{ posts: string[]; events: string[] }> {
  try {
    const [postsRes, eventsRes] = await Promise.all([
      fetch(`${API_URL}/community/public/posts`, { next: { revalidate: 3600 } }),
      fetch(`${API_URL}/community/public/events`, { next: { revalidate: 3600 } }),
    ]);

    const posts = postsRes.ok ? await postsRes.json() : [];
    const events = eventsRes.ok ? await eventsRes.json() : [];

    return {
      posts: Array.isArray(posts) ? posts.map((p: { id: string }) => p.id) : [],
      events: Array.isArray(events) ? events.map((e: { id: string }) => e.id) : [],
    };
  } catch {
    return { posts: [], events: [] };
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { posts, events } = await getCommunityIds();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/_about-us`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/_services`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/_contacts`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/privacy-policy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  const postRoutes: MetadataRoute.Sitemap = posts.map((id) => ({
    url: `${BASE_URL}/community/posts/${id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  const eventRoutes: MetadataRoute.Sitemap = events.map((id) => ({
    url: `${BASE_URL}/community/events/${id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...postRoutes, ...eventRoutes];
}
