"use client";

import { motion } from "framer-motion";
import { PawPrint } from "lucide-react";
import Image from "next/image";
// import Image from "next/image";

const patients = [
  { name: "DOGS", delay: 0.1, image: '/dog.avif' },
  { name: "CATS", delay: 0.2, image: '/cat.avif' },
  { name: "SQUIRRELS", delay: 0.3, image: '/squirrel.avif' },
  { name: "RABBITS", delay: 0.4, image: '/rabbit.avif' },
  { name: "TURTLES", delay: 0.5, image: '/turtle.avif' },
  { name: "PARROTS", delay: 0.6, image: '/parrot.avif' },
];

const backgroundPaws = [
  { top: "5%", left: "5%", rotate: -20, size: 40 },
  { top: "15%", left: "12%", rotate: 15, size: 30 },
  { top: "8%", right: "8%", rotate: 25, size: 45 },
  { bottom: "10%", left: "10%", rotate: -10, size: 35 },
];

export function Patients() {
  return (
    <section id="patients" className="relative py-24 overflow-hidden">
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
            className="text-5xl md:text-7xl font-black font-heading mb-6 text-[#1A1A1A] uppercase tracking-tight"
          >
            OUR PATIENTS
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl md:text-2xl text-[#1A1A1A]/80 font-medium"
          >
            We provide expert care for all your beloved pets.
          </motion.p>
        </div>

        {/* Patients Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16 max-w-6xl mx-auto">
          {patients.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: p.delay }}
              className="flex flex-col items-center group"
            >
              {/* Circular Frame */}
              <div className="w-56 h-56 md:w-64 md:h-64 rounded-full border flex items-center justify-center p-4 mb-6 transition-transform group-hover:scale-105 shadow-sm overflow-hidden relative">
                {/* 
                  IMAGE PLACEHOLDER
                  Uncomment the following Image tag and add your pet image URL:
                */}

                <div className="relative w-[90%] h-[90%]">
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    className="object-contain mt-10"
                  />
                </div>

                {/* <div className="text-gray-200 font-bold uppercase tracking-widest text-xs opacity-50 z-0 select-none">
                  Image Placeholder
                </div> */}
              </div>

              {/* Title */}
              <h3 className="text-2xl md:text-3xl font-black font-heading text-[#1A1A1A] uppercase tracking-tighter">
                {p.name}
              </h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
