"use client";

import { motion } from "framer-motion";
import { Star, PawPrint } from "lucide-react";
import Image from "next/image";

const testimonials = [
  {
    quote: "Excellent service! My dog is now healthy and happy thanks to the wonderful team. They took the time to explain everything and made us feel at ease. I highly recommend them to any pet owner!",
    name: "PETER K.",
    image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    quote: "The veterinarians here are incredibly kind and dedicated. They treated my dog like their own and provided us with the best care possible. I'm so grateful for their compassion and professionalism.",
    name: "PETER K.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    quote: "They responded so quickly when my cat was unwell. Thanks to their swift action and expertise, they saved her life! I couldn't be more thankful for the care and attention they gave her.",
    name: "PETER K.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200",
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
      {backgroundPaws.map((paw, i) => (
        <div
          key={i}
          className="absolute text-gray-300 pointer-events-none opacity-40 z-0"
          style={{
            top: paw.top,
            left: paw.left,
            right: paw.right,
            bottom: paw.bottom,
            transform: `rotate(${paw.rotate}deg)`,
          }}
        >
          <PawPrint size={paw.size} />
        </div>
      ))}

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-20 px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-black font-heading mb-6 text-[#1A1A1A] uppercase tracking-tight leading-[1.1]"
          >
            WHAT OUR CLIENTS <br className="hidden md:block" /> SAY ABOUT US
          </motion.h2>
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
