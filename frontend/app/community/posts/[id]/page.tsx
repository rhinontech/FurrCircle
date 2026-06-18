/* eslint-disable @next/next/no-img-element */
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
  } catch {
    return { title: "FurrCircle Post" };
  }
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-4">Post on FurrCircle</h1>
      <p className="mb-6 text-lg text-gray-600">Open this link in the FurrCircle app to read the post and join the conversation!</p>
      
      <a href={`furrcircle://post/${id}`} className="px-6 py-3 bg-[#e2733c] text-white rounded-full font-bold shadow-md hover:bg-[#d66731] transition mb-8 w-full block">
        Open in App
      </a>

      <div className="w-full border-t border-gray-100 my-4"></div>

      <p className="text-xs text-gray-400 font-medium mb-4 uppercase tracking-wider">
        Don&apos;t have the FurrCircle app? Download now
      </p>
      
      <div className="flex gap-4 justify-center w-full">
        {/* Apple App Store */}
        <a 
          href="https://apps.apple.com/in/app/furrcircle/id6762140389" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex-1 max-w-[150px] transition-transform duration-200 hover:scale-105"
        >
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" 
            alt="Download on App Store" 
            className="w-full h-auto"
          />
        </a>
        
        {/* Google Play Store */}
        <a 
          href="https://play.google.com/store/apps/details?id=com.furrcircle.app" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex-1 max-w-[150px] transition-transform duration-200 hover:scale-105"
        >
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
            alt="Get it on Google Play" 
            className="w-full h-auto"
          />
        </a>
      </div>
    </div>
  );
}
