"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { PawPrint } from "../Hero/Hero";
import { AnimatedHeading } from "@/components/AnimationProvider";

const frames = [
  {
    id: "left",
    color: "bg-[#9D8FE4]", // Purple
    width: "w-40 md:w-64",
    height: "h-72 md:h-[400px]",
    rotate: -12,
    delay: 0,
    margin: "mr-[-40px] md:mr-[-40px] mt-20",
    image: "/CTADog1.png",
    imageClass: "!top-[20%] !h-[80%]"
  },
  {
    id: "center",
    color: "bg-[#87CEEB]", // Sky Blue
    width: "w-56 md:w-92",
    height: "h-80 md:h-[550px]",
    rotate: 0,
    delay: 0.2,
    margin: "z-10",
    image: "/about-us/aboutInfo.png",
    imageClass: "!top-[20%] !h-[80%]"
  },
  {
    id: "right",
    color: "bg-[#FABC3F]", // Yellow
    width: "w-40 md:w-64",
    height: "h-72 md:h-[400px]",
    rotate: 12,
    delay: 0.4,
    margin: "ml-[-40px] md:ml-[-40px] mt-20",
    image: "/rabbit1.avif",
    imageClass: "!h-[100%] scale-[1.3] !top-[10%] origin-bottom"
  },
];

export function Hero() {
  return (
    <section className="relative pb-20 overflow-hidden ">
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto gap-6 pt-40">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            {/* Decorations */}
            {/* Tennis Ball */}
            <motion.div
              animate={{
                y: [0, -15, 0],
                rotate: [0, 10, -10, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -left-4 -top-0 w-10 h-10 md:w-14 md:h-14 z-10 hidden md:block"
            >
              <Image
                src="/decorations/tennis-ball.svg"
                alt="Tennis Ball"
                fill
                className="drop-shadow-xl"
              />
            </motion.div>

            {/* Blue Badge */}
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute left-[24%] top-[45%] w-12 h-16 md:w-10 md:h-14 z-20 hidden md:block"
            >
              <Image
                src="/decorations/prize-badge.svg"
                alt="Prize Badge"
                fill
                className="drop-shadow-xl"
              />
            </motion.div>

            {/* Pet Bowl */}
            <motion.div
              animate={{
                x: [0, 5, 0],
                rotate: [0, -3, 3, 0]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -right-16 md:-right-8 bottom-24 w-24 h-12 md:w-18 md:h-12 z-20 hidden md:block"
            >
              <Image
                src="/decorations/pet-bowl.svg"
                alt="Pet Bowl"
                fill
                className="drop-shadow-xl"
              />
            </motion.div>

            <AnimatedHeading
              text="Your Pet's Health, \n All in One Place"
              tag="h1"
              stagger={0.1}
              className="text-5xl md:text-8xl font-black font-heading leading-[1.15] text-[#1A1A1A] uppercase tracking-tighter pt-5 relative z-10"
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg md:text-2xl text-[#1A1A1A] max-w-2xl font-medium"
          >
            Track health records, book vet appointments, and stay connected with a community that loves pets as much as you do.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <a
              href="#"
              aria-label="Download on the App Store"
              className="transition-transform hover:scale-105 active:scale-95"
            >
              <Image
                src="/appleButton.svg"
                alt="Download on the App Store"
                width={180}
                height={54}
                className="h-14 w-auto"
                priority
              />
            </a>
            <a
              href="#"
              aria-label="Get it on Google Play"
              className="transition-transform hover:scale-105 active:scale-95"
            >
              <Image
                src="/googleButton.svg"
                alt="Get it on Google Play"
                width={180}
                height={54}
                className="h-14 w-auto"
                priority
              />
            </a>
          </motion.div>
        </div>

        {/* Hero Visual Frames */}
        <div className="flex relative flex-row items-center justify-center gap-4 md:gap-8 mt-12 w-full">
          {frames.map((frame) => (
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
                sizes="(max-width: 768px) 10rem, (max-width: 1024px) 16rem, 23rem"
                priority={frame.id === "left"}
                className={`object-contain object-bottom ${frame.imageClass}`}
              />

              {/* <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white/20 font-black uppercase text-[10px] md:text-xs tracking-widest select-none text-center px-4">
                  {frame.id} Image Placeholder
                </span>
              </div> */}
            </motion.div>
          ))}

          <div className="absolute max-md:hidden top-10 left-20 w-44 h-44 pointer-events-none opacity-100">
            <Image src='/pawprint1.png' alt="Paw Print" fill className="object-contain" />
          </div>

          <div className="absolute max-md:hidden  bottom-0 right-30 w-44 h-44 pointer-events-none opacity-100">
            <Image src='/pawprint2.png' alt="Paw Print" fill className="object-contain" />
          </div>


          {/* <div
            className="absolute top-[25%] max-md:top-[24%] max-md:left-[5%] left-[10%] w-20 h-20 text-[#1A1A1A]/10"
          >
            <PawPrint className="w-full h-full" />
          </div>
          <div
            className="absolute top-[13%] max-md:top-[24%] max-md:left-[5%] left-[6%] w-20 h-20 text-[#1A1A1A]/10 -rotate-30"
          >
            <PawPrint className="w-full h-full" />
          </div>
          <div
            className="absolute top-[8%] max-md:top-[24%] max-md:left-[5%] left-[13%] w-16 h-16 text-[#1A1A1A]/10"
          >
            <PawPrint className="w-full h-full" />
          </div> */}



          {/* <div
            className="absolute -rotate-45 bottom-[8%] max-md:bottom-[24%] max-md:right-[5%] right-[13%] w-20 h-20 text-[#1A1A1A]/10"
          >
            <PawPrint className="w-full h-full" />
          </div>
          <div
            className="absolute -rotate-30 bottom-[20%] max-md:bottom-[24%] max-md:right-[5%] right-[15%] w-16 h-16 text-[#1A1A1A]/10"
          >
            <PawPrint className="w-full h-full" />
          </div>

          <div
            className="absolute -rotate-15 bottom-[32%] max-md:bottom-[24%] max-md:right-[5%] right-[13%] w-12 h-12 text-[#1A1A1A]/10"
          >
            <PawPrint className="w-full h-full" />
          </div> */}



        </div>
      </div>

      {/* Background blobs */}
      {/* <div className="absolute top-[10%] -left-[10%] w-[40%] h-[40%] bg-[#87CEEB]/10 blur-[100px] rounded-full" />
      <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-[#FABC3F]/10 blur-[100px] rounded-full" /> */}
    </section>
  );
}
