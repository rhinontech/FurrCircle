"use client";

import { AnimatedHeading } from "@/components/AnimationProvider";
import { motion } from "framer-motion";
import { Star, PawPrint } from "lucide-react";
import Image from "next/image";

const testimonials = [
  {
    quote: "FurrCircle completely changed how I manage my dog's health. I can see all his records, upcoming vaccines, and vet appointments in one app. It's a game changer!",
    name: "ANJALI P.",
    image: '/testimonials/testimonial1.jpeg',
  },
  {
    quote: "Booking a vet through FurrCircle was so easy. I found a great clinic nearby, picked a time, and got a reminder the day before. My cat's care has never been this stress-free.",
    name: "ISHRA F.",
    image: '/testimonials/testimonial2.jpeg',
  },
  {
    quote: "I love the community on FurrCircle. I've met so many pet parents nearby, discovered local pet events, and even got great advice on my rabbit's diet. Highly recommend!",
    name: "RITIKA S.",
    image: '/testimonials/testimonial3.png',
  },
];

const backgroundPaws = [
  { top: "10%", left: "8%", rotate: -20, size: 40 },
  { top: "25%", left: "12%", rotate: 15, size: 30 },
  { top: "15%", right: "12%", rotate: 25, size: 45 },
  { bottom: "20%", right: "8%", rotate: -10, size: 35 },
];

export function Testimonials() {
  return (
    <section id="reviews" className="relative py-24 overflow-hidden">
      {/* Background Paws */}
      <div className="absolute max-md:hidden top-30 left-40 w-34 h-34 pointer-events-none opacity-100">
        <Image src='/pawprint1.png' alt="Paw Print" fill sizes="136px" className="object-contain" />
      </div>
      <div className="absolute max-md:hidden top-30 right-40 w-34 h-34 pointer-events-none opacity-100">
        <Image src='/pawprint1.png' alt="Paw Print" fill sizes="136px" className="object-contain" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-20 px-4">
          <AnimatedHeading
            text="LOVED BY \n PET PARENTS"
            className="text-5xl md:text-6xl font-black font-heading mb-6 text-[#1A1A1A] uppercase tracking-tight leading-[1.1]"
          />
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-start text-left"
            >
              {/* Header Row: Avatar + Info */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-50 shrink-0">
                  <Image
                    src={t.image}
                    alt={t.name}
                    width={64}
                    height={64}
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-black text-[#1A1A1A] text-xl tracking-tight uppercase">
                    {t.name}
                  </h4>
                  <div className="flex gap-1 mt-1">
                    {[...Array(5)].map((_, starIndex) => (
                      <Star key={starIndex} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Quote Text */}
              <p className="text-[#1A1A1A]/70 text-lg leading-relaxed pt-2 border-t border-gray-50">
                {t.quote}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
