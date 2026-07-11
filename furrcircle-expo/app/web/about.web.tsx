import React from "react";
import { Link } from "expo-router";
import { motion } from "framer-motion";
import { HeartHandshake, BadgeCheck, Handshake } from "lucide-react";
import {
  FadeInUp,
  StaggerContainer,
  StaggerItem,
  BouncingElement,
  PawPrint
} from "./components/AnimationProvider";

// ==========================================
// DATA DEFINITIONS
// ==========================================

const values = [
  {
    icon: HeartHandshake,
    title: "Compassion",
    content:
      "We approach every pet's digital health journey with empathy and kindness. Our digital ecosystem is designed to ensure their comfort and well-being, creating a safe and loving environment where their happiness and health can flourish through proactive care.",
  },
  {
    icon: BadgeCheck,
    title: "Excellence",
    content:
      "We uphold uncompromising standards in every aspect of our digital platform, from meticulous health tracking to unparalleled support. Our dedication to excellence is a promise that your pet's records are managed with the highest care, ensuring their lifelong well-being.",
  },
  {
    icon: Handshake,
    title: "Trust",
    content:
      "Your trust is the foundation of the FurrCircle community. We are committed to maintaining it through unwavering transparency, data security, and clear communication. Count on us to be your dependable digital partner, always putting your pet’s health first.",
  },
];

const stats = [
  {
    value: "10K+",
    title: "Protected Pets",
    content:
      "FurrCircle has secured the health journeys of over 10,000 pets, providing peace of mind to their parents.",
  },
  {
    value: "99%",
    title: "Parent Satisfaction",
    content:
      "We take pride in our 99% satisfaction rate, a testament to our commitment to digital excellence.",
  },
  {
    value: "5",
    title: "Years of Innovation",
    content:
      "With 5 years of digital pioneering, we've been dedicated to ensuring your pets lead healthy and happy lives.",
  },
  {
    value: "50+",
    title: "Expert Team Members",
    content:
      "Our team comprises 50+ experts, including veterinarians, developers, and pet health specialists.",
  },
  {
    value: "1st",
    title: "Choice for Pet Parents",
    content:
      "Many consider FurrCircle their first choice for digital pet care, making us a trusted name in the ecosystem.",
  },
];

const teamMembers = [
  {
    name: "Dr. Emily Anderson",
    role: "Chief Veterinarian",
    image: "/gallery/family1.png",
  },
  {
    name: "Linda Parker",
    role: "Certified Pet Trainer",
    image: "/gallery/family2.png",
  },
  {
    name: "Maria Rodriguez",
    role: "Professional Pet Groomer",
    image: "/gallery/family3.png",
  },
  {
    name: "David Johnson",
    role: "Care Manager",
    image: "/gallery/family4.png",
  },
];

const galleryImages = [
  "/gallery/family1.jpeg",
  "/gallery/family2.jpeg",
  "/gallery/family3.jpeg",
  "/gallery/family4.jpeg",
  "/gallery/family5.jpeg",
  "/gallery/family6.jpeg",
];
const allGalleryImages = [...galleryImages, ...galleryImages];

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function WebAboutPage() {
  return (
    <main className="flex-1 flex flex-col min-h-screen bg-[#fffbf5]">
      
      {/* -------------------------------------------
          ABOUT HERO SECTION
          ------------------------------------------- */}
      <section className="relative overflow-hidden bg-[#987D6B]/20 py-20 px-6 md:px-24 flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="flex-1 z-10 max-md:text-center">
          <h1 className="text-5xl md:text-7xl font-bold leading-tight text-[#1A1A1A]">
            Welcome, <br />Buddies to FurrCircle!
          </h1>
        </div>
        <div className="flex-1 flex justify-center z-10">
          <img
            src="/about-us/aboutHero.webp"
            alt="aboutHero"
            className="w-full max-w-md h-auto object-contain"
          />
        </div>

        <BouncingElement
          axis="rotate"
          startVal={10}
          endVal={40}
          className="absolute top-[8%] right-[35%] w-20 h-20 max-md:hidden text-[#987D6B]/30"
        >
          <PawPrint className="w-full h-full" />
        </BouncingElement>
        <BouncingElement
          axis="rotate"
          startVal={-10}
          endVal={-40}
          className="absolute top-[22%] right-[5%] w-10 h-10 text-[#987D6B]/30"
        >
          <PawPrint className="w-full h-full" /> 
        </BouncingElement>
        <div className="absolute text-[#987D6B]/20 bottom-3 w-60 h-60 max-md:w-36 max-md:h-36 -right-10 -rotate-60 pointer-events-none">
          <PawPrint className="w-full h-full" />
        </div>
      </section>

      {/* -------------------------------------------
          INFO SECTION
          ------------------------------------------- */}
      <section className="relative px-6 md:px-28 py-20 flex flex-col-reverse md:flex-row items-center gap-16 md:gap-20">
        <BouncingElement
          axis="rotate"
          startVal={10}
          endVal={40}
          className="absolute z-10 top-[28%] max-md:top-[50%] max-md:left-[5%] left-[2%] w-48 h-auto max-md:w-20 text-[#987D6B]/15"
        >
          <PawPrint className="w-full h-full" />
        </BouncingElement>
        <BouncingElement
          axis="rotate"
          startVal={-10}
          endVal={-40}
          className="absolute top-[15%] right-[7%] w-20 h-20 max-md:top-[75%] max-md:right-[5%] text-[#987D6B]/40"
        >
          <PawPrint className="w-full h-full" />
        </BouncingElement>

        <div className="flex-1 flex items-center justify-center">
          <FadeInUp>
            <img
              src="/about-us/aboutInfo.webp"
              alt="Pet Care"
              className="max-h-[450px] w-auto object-contain"
            />
          </FadeInUp>
        </div>

        <div className="flex-1">
          <FadeInUp delay={0.3}>
            <div className="flex flex-col max-md:items-center max-md:text-center">
              <h2 className="text-4xl md:text-6xl font-bold text-[#1A1A1A] mb-8 leading-tight">
                Dedicated to Your Pet's Digital Health Journey
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                FurrCircle is more than just a tracking app – we're a community of passionate pet parents committed to simplifying pet wellness. Our team has built a comprehensive digital ecosystem to ensure the highest quality health management for your furry companions. Your pet's happiness and health are our top priorities, and we've designed every feature to give you the peace of mind you deserve.
              </p>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* -------------------------------------------
          VALUES SECTION
          ------------------------------------------- */}
      <section className="py-24 bg-[url('/curveBg.svg')] bg-cover bg-top bg-no-repeat">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col mb-16 max-md:text-center">
            <FadeInUp>
              <h2 className="text-4xl md:text-7xl font-bold text-[#1A1A1A] mb-4">Our Values</h2>
            </FadeInUp>
          </div>
          <div className="flex flex-col md:flex-row gap-8 justify-between">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <StaggerItem key={index} className="flex-1">
                  <div className="h-full flex flex-col gap-6 bg-white p-8 rounded-3xl border border-black/5 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl group hover:bg-[#987D6B]">
                    <div className="w-14 h-14 rounded-full bg-[#987D6B] flex items-center justify-center group-hover:bg-white/20 transition-colors shrink-0">
                      <Icon className="w-7 h-7 text-white group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-[#1A1A1A] mb-4 group-hover:text-white transition-colors">
                        {value.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed group-hover:text-white/95 transition-colors">
                        {value.content}
                      </p>
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </div>
        </div>
      </section>

      {/* -------------------------------------------
          STATS SECTION
          ------------------------------------------- */}
      <section className="py-24 bg-gray-50 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-16 justify-between items-center">
          <div className="flex-1 flex justify-center">
            <img
              src="/about-us/aboutStats.webp"
              alt="aboutStats"
              className="max-w-xs md:max-w-md h-auto"
            />
          </div>

          <div className="flex-1 flex flex-col gap-10 w-full">
            {stats.map((stat) => (
              <FadeInUp key={stat.value}>
                <div className="flex max-w-lg items-center gap-6">
                  <h2 className="text-5xl font-black text-[#1A1A1A] w-[140px] shrink-0">{stat.value}</h2>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-[#1A1A1A]">{stat.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{stat.content}</p>
                  </div>
                </div>
              </FadeInUp>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------
          GALLERY SECTION
          ------------------------------------------- */}
      <section className="py-24 overflow-hidden bg-white">
        <div className="container relative mx-auto px-6 max-w-7xl mb-16">
          <div className="flex flex-col items-center text-center">
            <FadeInUp>
              <h2 className="text-4xl md:text-6xl font-bold mb-4 text-[#1A1A1A]">Our FurrCircle Moments</h2>
            </FadeInUp>
          </div>
        </div>

        <div className="relative flex overflow-hidden">
          <motion.div
            className="flex gap-4 px-5"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 40, ease: "linear", repeat: Infinity }}
            style={{ width: "fit-content" }}
          >
            {allGalleryImages.map((src, index) => (
              <div
                key={index}
                className="relative w-50 h-70 md:w-75 md:h-87.5 rounded-[1rem] overflow-hidden shrink-0 shadow-lg"
              >
                <div className="relative w-full h-full">
                  <img
                    src={src}
                    alt={`Family picture ${index + 1}`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* -------------------------------------------
          TEAM SECTION
          ------------------------------------------- */}
      <section className="py-24 px-6 relative bg-gray-50">
        <div className="max-w-7xl flex flex-col mx-auto gap-12">
          <div className="flex flex-col md:flex-row justify-between max-md:text-center gap-6 items-end">
            <h2 className="text-4xl md:text-6xl font-bold text-[#1A1A1A]">
              Our FurrCircle Team
            </h2>
            <p className="text-gray-500 max-w-sm text-lg leading-relaxed">
              Meet the Passionate Specialists Who Make FurrCircle a Safe Haven for Your Beloved Pets
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {teamMembers.map((mem) => (
              <div 
                key={mem.name} 
                className="group relative h-[350px] rounded-[1rem] overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500"
              >
                <div className="absolute inset-0 transition-transform duration-700 hover:scale-105">
                  <img
                    src={mem.image}
                    alt={mem.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 bg-white group-hover:bg-[#987D6B] w-[60%] rounded-tr-[1rem] left-0 right-0 p-8 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                  <h3 className="text-2xl font-bold text-[#1A1A1A] group-hover:text-white transition-colors duration-300 mb-1">
                    {mem.name}
                  </h3>
                  <p className="text-gray-500 group-hover:text-white/70 text-sm font-medium">
                    {mem.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------
          CTA SECTION
          ------------------------------------------- */}
      <section className="py-24 px-6 relative bg-white">
        <div className="absolute max-xl:hidden left-20 top-20">
          <FadeInUp>
            <img src="/about-us/aboutCTA1.webp" alt="Pet Care" className="w-[380px] h-auto" />
          </FadeInUp>
        </div>

        <BouncingElement
          axis="rotate"
          startVal={10}
          endVal={40}
          className="absolute top-[20%] max-md:top-[54%] max-md:left-[5%] left-[5%] w-20 h-20 text-[#987D6B]/50"
        >
          <PawPrint className="w-full h-full" />
        </BouncingElement>
        <BouncingElement
          axis="rotate"
          startVal={-10}
          endVal={-40}
          className="absolute top-[10%] max-md:hidden left-[31%] w-20 h-20 text-[#987D6B]/50"
        >
          <PawPrint className="w-full h-full" />
        </BouncingElement>

        <div className="max-w-7xl mx-auto flex justify-end max-xl:justify-center">
          <FadeInUp delay={0.3}>
            <div className="flex flex-col max-md:items-center max-md:text-center max-w-2xl">
              <h2 className="text-4xl md:text-6xl font-bold text-[#1A1A1A] mb-8 leading-tight">
                Ready to Experience the <br /> FurrCircle Ecosystem?
              </h2>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                Get Started Today and Discover a World of Happiness and Health for Your Pet with our Digital Health Passport.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center h-14 px-8 rounded-full bg-[#987D6B] text-white font-bold text-lg hover:bg-[#8A7160] transition-colors shadow-lg self-start max-md:self-center"
              >
                Get Started Now
              </Link>
            </div>
          </FadeInUp>
        </div>
      </section>

    </main>
  );
}
