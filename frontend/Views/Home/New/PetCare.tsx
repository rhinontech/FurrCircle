"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { PawPrint } from "lucide-react";
import { AnimatedHeading } from "@/components/AnimationProvider";

const careTips = [
  {
    title: "REGULAR EXERCISE",
    description: "Ensure your pet gets daily exercise to maintain a healthy weight and prevent behavioral issues.",
    color: "bg-[#53AF54]",
  },
  {
    title: "PROPER NUTRITION",
    description: "Feed your pet a balanced diet suited to their needs for overall well-being.",
    color: "bg-[#EA5222]",
  },
  {
    title: "ROUTINE VET VISITS",
    description: "Schedule regular check-ups to keep vaccinations up to date and catch any health issues early.",
    color: "bg-[#0CA2D0]",
  },
];

const backgroundPaws = [
  { top: "10%", right: "15%", rotate: 25, size: 45 },
  { top: "30%", right: "10%", rotate: -10, size: 35 },
  { bottom: "20%", right: "12%", rotate: 10, size: 40 },
];

export function PetCare() {
  return (
    <section className="relative pb-20 overflow-hidden">
      {/* Background Paws */}
      <div className="absolute max-md:hidden top-80 right-20 w-34 h-34 pointer-events-none opacity-100">
        <Image src='/pawprint1.png' alt="Paw Print" fill className="object-contain" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          {/* Left Side: Oval Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-1/2 flex justify-center"
          >
            <div className="relative w-full max-w-xl aspect-[3/4.5] rounded-full overflow-hidden bg-[#87CEEB] shadow-2xl">
              <Image
                src="/contact/contactHero.png"
                alt="Happy Dog and Cat"
                fill
                className="object-cover !h-[70%] !top-auto !bottom-0"
                unoptimized
              />
            </div>
          </motion.div>

          {/* Right Side: Content */}
          <div className="w-full lg:w-1/2">
            <AnimatedHeading
              text="HOW TO TAKE CARE \n OF YOUR PET"
              className="text-4xl md:text-6xl font-black font-heading mb-12 text-[#1A1A1A] leading-tight uppercase"
            />

            <div className="space-y-10">
              {careTips.map((tip, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-6"
                >
                  <div className={`mt-2 w-4 h-4 rounded-full shrink-0 ${tip.color}`} />
                  <div>
                    <h3 className="text-2xl font-black font-heading mb-3 text-[#1A1A1A] uppercase tracking-tight">
                      {tip.title}
                    </h3>
                    <p className="text-lg text-[#1A1A1A]/70 leading-relaxed max-w-md">
                      {tip.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
