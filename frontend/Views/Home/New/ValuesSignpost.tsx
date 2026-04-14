"use client";

import { motion } from "framer-motion";
import { Stethoscope, Monitor, Banknote, Heart, Timer, PawPrint } from "lucide-react";

const signs = [
  {
    title: "EXPERT CARE",
    icon: <Stethoscope className="w-6 h-6" />,
    color: "bg-[#0CA2D0]",
    rotate: -3,
    delay: 0.1,
  },
  {
    title: "TOP EQUIPMENT",
    icon: <Monitor className="w-6 h-6" />,
    color: "bg-[#EA5222]",
    rotate: 2,
    delay: 0.2,
  },
  {
    title: "AFFORDABLE",
    icon: <Banknote className="w-6 h-6" />,
    color: "bg-[#53AF54]",
    rotate: -2,
    delay: 0.3,
  },
  {
    title: "COMPASSIONATE CARE",
    icon: <Heart className="w-6 h-6 fill-white" />,
    color: "bg-[#9D8FE4]",
    rotate: 3,
    delay: 0.4,
  },
  {
    title: "FAST SERVICE",
    icon: <Timer className="w-6 h-6" />,
    color: "bg-[#FABC3F]",
    rotate: -1,
    delay: 0.5,
  },
];

const backgroundPaws = [
  { top: "15%", left: "10%", rotate: -20, size: 40 },
  { top: "25%", left: "18%", rotate: 15, size: 30 },
  { top: "10%", right: "15%", rotate: 25, size: 45 },
  { top: "30%", right: "8%", rotate: -10, size: 35 },
  { bottom: "20%", left: "12%", rotate: 10, size: 40 },
  { bottom: "10%", right: "15%", rotate: -15, size: 50 },
];

export function ValuesSignpost() {
  return (
    <section className="relative py-24 overflow-hidden min-h-[900px] flex flex-col items-center">
      {/* Background Paws */}
      {backgroundPaws.map((paw, i) => (
        <div
          key={i}
          className="absolute text-gray-300 pointer-events-none opacity-40"
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

      <div className="container mx-auto px-6 relative z-10 flex flex-col items-center">
        {/* Header Text */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-extrabold mb-6 text-[#1A1A1A] uppercase"
          >
            WHY CHOOSE US?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl md:text-3xl text-gray-600 font-normal"
          >
            Exceptional care, advanced technology, and unbeatable value.
          </motion.p>
        </div>

        {/* The Signpost */}
        <div className="relative flex flex-col items-center w-full max-w-lg mt-12 pb-24">
          {/* Central Pole */}
          <div className="absolute top-0 bottom-0 w-8 bg-[#1A1A1A] rounded-full mx-auto" />
          
          {/* Top Knob */}
          <div className="absolute -top-4 w-12 h-12 bg-[#1A1A1A] rounded-full z-20" />

          {/* Signs Grid */}
          <div className="relative z-10 flex flex-col items-center gap-6 pt-12">
            {signs.map((sign, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8, x: i % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, scale: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  delay: sign.delay,
                  type: "spring",
                  stiffness: 100
                }}
                className={`
                  flex items-center gap-4 px-10 py-5 rounded-2xl shadow-xl border-b-4 border-black/20
                  ${sign.color} text-white font-extrabold text-2xl md:text-3xl whitespace-nowrap
                `}
                style={{ rotate: `${sign.rotate}deg` }}
              >
                <div className="flex-shrink-0">
                  {sign.icon}
                </div>
                <span>{sign.title}</span>
              </motion.div>
            ))}
          </div>

          {/* Base */}
          <div className="absolute bottom-0 w-48 h-10 bg-[#1A1A1A] rounded-full" />
        </div>
      </div>
    </section>
  );
}
