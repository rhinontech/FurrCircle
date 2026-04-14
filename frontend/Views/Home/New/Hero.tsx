"use client";

import { motion } from "framer-motion";
import Image from "next/image";
// import Image from "next/image";

const frames = [
  {
    id: "left",
    color: "bg-[#9D8FE4]", // Purple
    width: "w-40 md:w-64",
    height: "h-72 md:h-[400px]",
    rotate: -12,
    delay: 0,
    margin: "mr-[-40px] md:mr-[-40px] mt-20",
    image: "/CTADog1.png"
  },
  {
    id: "center",
    color: "bg-[#87CEEB]", // Sky Blue
    width: "w-56 md:w-92",
    height: "h-80 md:h-[550px]",
    rotate: 0,
    delay: 0.2,
    margin: "z-10",
    image: "/about-us/aboutInfo.png"
  },
  {
    id: "right",
    color: "bg-[#FABC3F]", // Yellow
    width: "w-40 md:w-64",
    height: "h-72 md:h-[400px]",
    rotate: 12,
    delay: 0.4,
    margin: "ml-[-40px] md:ml-[-40px] mt-20",
    image: "/about-us/aboutCTA1.png"
  },
];

export function Hero() {
  return (
    <section className="relative pt-32 pb-32 overflow-hidden ">
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-8xl font-black font-heading leading-tight mb-8 text-[#1A1A1A] uppercase tracking-tighter">
              Caring for your <br />
              pets like our own
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg md:text-2xl text-[#1A1A1A]/70 mb-12 max-w-2xl font-bold"
          >
            Quality veterinary services for dogs, cats, rabbits and more.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <button className="h-16 px-12 rounded-full text-xl font-black uppercase tracking-widest bg-[#87CEEB] text-[#1A1A1A] hover:bg-[#76BCD9] transition-all hover:scale-105 active:scale-95 shadow-xl">
              Book an appointment
            </button>
          </motion.div>
        </div>

        {/* Hero Visual Frames */}
        <div className="flex flex-row items-center justify-center gap-4 md:gap-8 mt-12 w-full">
          {frames.map((frame, i) => (
            <motion.div
              key={frame.id}
              initial={{ scale: 0.7, opacity: 0, rotate: frame.rotate }}
              whileInView={{ scale: 1, opacity: 1, rotate: frame.rotate }}
              viewport={{ once: true }}
              transition={{
                delay: frame.delay,
                duration: 0.8,
                type: "spring",
                stiffness: 100,
                damping: 20
              }}
              className={`
                ${frame.width} ${frame.height} 
                ${frame.color} ${frame.margin}
                rounded-[100px] md:rounded-[200px] 
                overflow-hidden shadow-2xl relative
              `}
            >
              {/* 
                IMAGE PLACEHOLDER
                Uncomment the following Image tag and add your pet image URL:
              */}

              <Image
                src={frame.image}
                alt={`${frame.id} pet`}
                fill
                className="object-contain object-bottom !top-[20%] !h-[80%]"
              />

              {/* <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white/20 font-black uppercase text-[10px] md:text-xs tracking-widest select-none text-center px-4">
                  {frame.id} Image Placeholder
                </span>
              </div> */}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Background blobs */}
      {/* <div className="absolute top-[10%] -left-[10%] w-[40%] h-[40%] bg-[#87CEEB]/10 blur-[100px] rounded-full" />
      <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-[#FABC3F]/10 blur-[100px] rounded-full" /> */}
    </section>
  );
}
