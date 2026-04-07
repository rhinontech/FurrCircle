import { FadeInUp } from "@/components/AnimationProvider";
import Image from "next/image";



const services = [
  {
    title: "Pet Training",
    content:
      "We offer training classes to improve your pet’s behavior, socialization, and obedience. Strengthen your bond with your furry friend and enjoy a harmonious relationship built on trust and communication.",
    image: "/gallery/family1.png",
  },
  {
    title: "Veterinary Care",
    content:
      "Our experienced vets provide top-notch medical care, from routine check-ups to complex procedures, ensuring your furry friend enjoys a long, healthy life. We’re your trusted partner in pet wellness.",
    image: "/gallery/family2.png",
  },
  {
    title: "Pet Boarding",
    content:
      "Leave your pet with us while you're away, knowing they’ll receive love, attention, and a comfortable environment akin to a home away from home. Your pet’s happiness is our priority.",
    image: "/gallery/family3.png",
  },
  {
    title: "Dog Walking",
    content:
      "Our trained walkers ensure your dog gets the exercise they need to stay happy and healthy. Regular walks improve their physical and mental well-being.",
    image: "/gallery/family4.png",
  },
  {
    title: "Grooming & Spa",
    content:
      "Pamper your pet with our grooming services, leaving them looking and feeling their best. Our grooming experts provide a spa-like experience, ensuring your pet radiates beauty and health.",
    image: "/gallery/family5.png",
  },
  {
    title: "Pet Sitting",
    content:
      "Experience peace of mind with Pet Care Pet Sitting services. Our professional pet sitters offer personalized care tailored to your pet’s unique needs, ensuring they feel cherished and content while you're away.",
    image: "/gallery/family6.png",
  },
];
export default function ServiceSection() {
  return (
    <div className="py-32 max-md:py-10 px-5 max-sm:px-2 relative">
      <div className="max-w-7xl mx-auto flex flex-col gap-10 max-md:gap-5">
        {services.map((ser) => (
          <FadeInUp key={ser.title}>
            <div className="relative group transition-all duration-300 hover:bg-primary hover:scale-110 w-6xl max-xl:w-full mx-auto rounded-full flex gap-20 p-3 bg-section-bg max-lg:flex-col max-lg:items-center max-lg:rounded-[100px] max-lg:p-10 max-lg:text-center max-lg:gap-10">
              <div>
                <Image src={ser.image} alt={ser.title} width={300} height={300} className="rounded-full" />
              </div>
              <div className="flex flex-col gap-10 justify-center">
                <h1 className="text-4xl font-heading group-hover:text-white">{ser.title}</h1>
                <p className="text-lg text-muted-foreground max-w-2xl group-hover:text-section-bg z-10">{ser.content}</p>
              </div>

              <div className="absolute h-28 w-28 max-md:h-16 max-md:w-16 bg-muted-primary rounded-full bottom-0 right-0 " />

            </div>
          </FadeInUp>
        ))}

      </div>

    </div>
  )
}