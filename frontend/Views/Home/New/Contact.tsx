"use client";

import { motion } from "framer-motion";
import { PawPrint } from "lucide-react";
// import Image from "next/image";

export function Contact() {
  return (
    <section className="relative py-24 bg-[#F3F0E9] overflow-hidden">
      {/* Decorative Floating Circles */}
      {/* Left Circle (Green) */}
      <motion.div
        initial={{ opacity: 0, x: -100 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="absolute left-[5%] top-[10%] w-48 h-48 md:w-64 md:h-64 rounded-full bg-[#53AF54] overflow-hidden flex items-center justify-center border-8 border-white shadow-2xl z-20"
      >
        {/*
          PARROT IMAGE PLACEHOLDER
          Uncomment the following Image tag and add your Parrot image URL:
        */}
        {/*
        <Image 
          src="/path/to/parrot-image.png" 
          alt="Parrot" 
          fill 
          className="object-cover" 
        />
        */}
        <span className="text-white/20 font-black text-xs uppercase tracking-widest text-center px-4 select-none">
          Parrot Placeholder
        </span>
      </motion.div>

      {/* Right Circle (Purple) */}
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="absolute right-[5%] bottom-[10%] w-40 h-40 md:w-56 md:h-56 rounded-full bg-[#9D8FE4] overflow-hidden flex items-center justify-center border-8 border-white shadow-2xl z-20"
      >
        {/*
          RABBIT IMAGE PLACEHOLDER
          Uncomment the following Image tag and add your Rabbit image URL:
        */}
        {/*
        <Image 
          src="/path/to/rabbit-image.png" 
          alt="Rabbit" 
          fill 
          className="object-cover" 
        />
        */}
        <span className="text-white/20 font-black text-xs uppercase tracking-widest text-center px-4 select-none">
          Rabbit Placeholder
        </span>
      </motion.div>

      {/* Background Paws */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[20%] left-[20%] rotate-12 text-gray-300">
          <PawPrint size={40} />
        </div>
        <div className="absolute top-[30%] right-[15%] -rotate-20 text-gray-300">
          <PawPrint size={30} />
        </div>
        <div className="absolute bottom-[20%] left-[10%] rotate-45 text-gray-300">
          <PawPrint size={35} />
        </div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 px-4">
          <motion.h2
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-black font-heading mb-6 text-[#1A1A1A] uppercase tracking-tight leading-[1.1]"
          >
            STILL HAVE QUESTIONS? <br className="hidden md:block" /> GET IN TOUCH.
          </motion.h2>
        </div>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1A1A1A] px-1 uppercase tracking-wider">Name</label>
                <input
                  type="text"
                  placeholder="Jane Smith"
                  className="w-full px-6 py-4 rounded-xl border-none bg-gray-100 focus:ring-2 focus:ring-[#87CEEB] text-[#1A1A1A] placeholder:text-gray-400 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1A1A1A] px-1 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  placeholder="jane@framer.com"
                  className="w-full px-6 py-4 rounded-xl border-none bg-gray-100 focus:ring-2 focus:ring-[#87CEEB] text-[#1A1A1A] placeholder:text-gray-400 outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1A1A1A] px-1 uppercase tracking-wider">Message</label>
              <textarea
                rows={5}
                placeholder="Your message..."
                className="w-full px-6 py-4 rounded-xl border-none bg-gray-100 focus:ring-2 focus:ring-[#87CEEB] text-[#1A1A1A] placeholder:text-gray-400 outline-none transition-all resize-none"
              />
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-5 rounded-full bg-[#87CEEB] text-[#1A1A1A] font-black text-xl uppercase tracking-widest shadow-lg hover:shadow-xl transition-all mt-4"
            >
              Submit
            </motion.button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
