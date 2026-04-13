"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { FadeInUp } from "@/components/AnimationProvider";
import { BouncingElement, PawPrint } from "../Hero/Hero";

export function FeaturedMarquee() {
  const text = "WELCOME TO FURRCIRCLE, BUDDIES! ✨ ";

  return (
    <section className="py-32 max-md:py-10 bg-[#F9F8F6] overflow-hidden flex justify-center px-5">
      <div className="container relative flex max-md:flex-col justify-between mx-auto max-w-7xl">

        {/* Left side */}
        <FadeInUp>
          <div className="flex items-center max-w-2xl">
            <div className="flex flex-col gap-10">
              <h2 className="text-4xl md:text-6xl font-heading text-foreground mb-4">
                We are Dedicated to Your Pet's Digital Health Journey
              </h2>
              <p className="text-muted-foreground text-lg max-w-lg leading-relaxed group-hover:text-primary-foreground/90 transition-colors">FurrCircle is more than just a tracking app – we're a community of passionate pet parents committed to simplifying pet wellness. Our team has built a comprehensive digital ecosystem to ensure the highest quality health management for your furry companions. Your pet's happiness and health are our top priorities, and we've designed every feature to give you the peace of mind you deserve.</p>
            </div>
          </div>
        </FadeInUp>

        {/* Right side */}
        <FadeInUp delay={0.3}>
          <div className="relative flex justify-center">
            {/* Rotating Text */}
            <div className="absolute -right-5 max-md:right-3 top-20 max-md:top-10">
              <FadeInUp>
                <div className="relative flex items-center justify-center w-[150px] h-[150px] max-md:w-[100px] max-md:h-[100px] max-w-md mx-auto aspect-square">

                  {/* Rotating Text */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 z-0"
                  >
                    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                      <path
                        id="circlePath"
                        d="M 50, 50 m -45, 0 a 45,45 0 1,1 90,0 a 45,45 0 1,1 -90,0"
                        fill="transparent"
                      />
                      <text className="text-[10px] font-heading fill-blue-300 tracking-[0.25em] uppercase">
                        <textPath href="#circlePath" startOffset="0%">
                          {text} {text} {text}
                        </textPath>
                      </text>
                    </svg>
                  </motion.div>

                  {/* Center Image Container */}
                  <div className="relative z-10 w-[65%] h-[65%] rounded-full flex justify-center items-center overflow-hidden">
                    <div className="w-16 h-16 max-md:h-12 max-md:w-12 text-primary/20 -rotate-40">
                      <PawPrint className="w-full h-full" />
                    </div>
                  </div>

                </div>
              </FadeInUp>
            </div>
            <Image loading="eager" src="/infoCat1.png" alt="Pet Care" width={500} height={500} />
          </div>
        </FadeInUp>




        {/* paw print */}
        <BouncingElement
          axis="rotate"
          startVal={10}
          endVal={40}
          className="absolute top-[70%] max-md:top-[95%] max-md:left-0 left-[50%] w-20 h-20 text-primary/70"
        >
          <PawPrint className="w-full h-full" />
        </BouncingElement>
        <BouncingElement
          axis="rotate"
          startVal={0}
          endVal={-30}
          className="absolute top-[20%] max-md:top-[95%] max-md:left-[80%] left-[58%] w-14 h-14 text-primary/70"
        >
          <PawPrint className="w-full h-full" />
        </BouncingElement>

      </div>
    </section>
  );
}
