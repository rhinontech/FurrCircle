import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> | { id: string } }): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
    const res = await fetch(`${apiUrl}/community/public/posts/${id}`, { cache: "no-store" });
    
    if (!res.ok) {
      return { title: "Post not found | FurrCircle" };
    }
    
    const post = await res.json();
    const title = `Post by a FurrCircle Member`;
    const description = post.content || "Join the conversation on FurrCircle!";
    
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: post.imageUrl ? [post.imageUrl] : [],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: post.imageUrl ? [post.imageUrl] : [],
      }
    };
  } catch (e) {
    return { title: "FurrCircle Post" };
  }
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <h1 className="text-3xl font-bold mb-4">Post on FurrCircle</h1>
      <p className="mb-6 text-lg text-gray-600">Open this link in the FurrCircle app to read the post and join the conversation!</p>
      <a href={`furrcircle://posts/${id}`} className="px-6 py-3 bg-[#e2733c] text-white rounded-full font-bold shadow-md hover:bg-[#d66731] transition">
        Open in App
      </a>
    </div>
  );
}
