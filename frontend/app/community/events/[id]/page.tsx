import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> | { id: string } }): Promise<Metadata> {
  // Await params for Next.js 15 compatibility
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
    const res = await fetch(`${apiUrl}/community/public/events/${id}`, { cache: "no-store" });
    
    if (!res.ok) {
      return { title: "Event not found | FurrCircle" };
    }
    
    const event = await res.json();
    
    return {
      title: `${event.title} | FurrCircle Events`,
      description: event.description || "Join this event on FurrCircle!",
      openGraph: {
        title: event.title,
        description: event.description || "Join this event on FurrCircle!",
        images: event.imageUrl ? [event.imageUrl] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: event.title,
        description: event.description,
        images: event.imageUrl ? [event.imageUrl] : [],
      }
    };
  } catch (e) {
    return { title: "FurrCircle Event" };
  }
}

export default async function EventPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <h1 className="text-3xl font-bold mb-4">Event on FurrCircle</h1>
      <p className="mb-6 text-lg text-gray-600">Open this link in the FurrCircle app to view and book this event!</p>
      <a href={`furrcircle://events/${id}`} className="px-6 py-3 bg-[#e2733c] text-white rounded-full font-bold shadow-md hover:bg-[#d66731] transition">
        Open in App
      </a>
    </div>
  );
}
