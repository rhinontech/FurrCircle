/* eslint-disable @next/next/no-img-element */
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> | { id: string } }): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.furrcircle.com/api";
    const res = await fetch(`${apiUrl}/community/public/circles/${id}`, { cache: "no-store" });
    
    if (!res.ok) {
      return { title: "Circle not found | FurrCircle" };
    }
    
    const circle = await res.json();
    const title = `Join "${circle.name}" on FurrCircle!`;
    const description = circle.description || "Join this circle to connect with other pet lovers and share experiences.";
    
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: circle.coverImage ? [circle.coverImage] : ["https://furrcircle.com/logo/furrcircle_light_logo.png"],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: circle.coverImage ? [circle.coverImage] : ["https://furrcircle.com/logo/furrcircle_light_logo.png"],
      }
    };
  } catch {
    return { title: "Join Circle | FurrCircle" };
  }
}

export default async function CirclePage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  let circle: { name?: string; description?: string; category?: string; memberCount?: number; coverImage?: string } | null = null;
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.furrcircle.com/api";
    const res = await fetch(`${apiUrl}/community/public/circles/${id}`, { cache: "no-store" });
    if (res.ok) {
      circle = await res.json();
    }
  } catch {
    console.error("Failed to load circle on web page:");
  }

  const name = circle?.name || "Pet Lovers Circle";
  const description = circle?.description || "Join the conversation and connect with other pet parents.";
  const category = circle?.category || "general";
  const memberCount = circle?.memberCount || 0;
  const coverImage = circle?.coverImage;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-12 bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col items-center p-6 text-center">
        
        {/* Cover image or Category Icon */}
        <div className="w-full aspect-[16/9] rounded-2xl bg-orange-100 flex items-center justify-center overflow-hidden mb-6 relative">
          {coverImage ? (
            <img src={coverImage} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center">
              <span className="text-6xl mb-2">🐾</span>
              <span className="text-xs uppercase tracking-widest text-orange-500 font-bold">{category}</span>
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2 leading-tight">
          Join &quot;{name}&quot; on FurrCircle
        </h1>

        {/* Members Count */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4 font-semibold">
          <span>👥</span>
          <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
        </div>

        {/* Description */}
        <p className="text-gray-600 mb-8 max-w-sm text-sm leading-relaxed">
          {description}
        </p>

        {/* Open in App Button */}
        <a 
          href={`furrcircle://circle/${id}`} 
          className="w-full py-4 bg-[#e2733c] hover:bg-[#d66731] text-white rounded-full font-bold shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 text-center mb-6"
        >
          Open in App
        </a>

        <div className="w-full border-t border-gray-100 my-4"></div>

        {/* App download section */}
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
    </div>
  );
}
