"use client";

import Image from "next/image";
import { FadeInUp } from "@/components/AnimationProvider";
import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";
import Button from "@/components/Common/Button";
import Link from "next/link";

export const PawPrint = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
    <g transform="translate(0 0)">
      <path d="M 9.076 0 L 39.965 9.076 L 30.889 39.965 L 0 30.889 Z" fill="transparent"></path>
      <path d="M 23.678 21.861 C 22.096 19.14 18.662 18.131 15.859 19.563 L 9.833 22.637 C 6.409 24.3 6.979 29.569 10.682 30.457 C 12.676 30.986 14.581 30.444 16.708 31.111 C 18.934 31.723 20.318 33.1 22.255 33.858 C 25.817 34.994 29.035 30.895 27.079 27.704 L 23.678 21.86 Z M 33.722 17.691 C 31.985 16.787 29.973 18.425 29.087 20.083 C 26.38 25.228 31.373 27.828 34.172 22.888 C 35.346 20.764 35.148 18.477 33.722 17.691 Z M 25.04 18.349 C 26.874 18.888 28.978 17.241 29.73 14.683 C 31.356 8.471 25.072 6.624 23.084 12.73 C 22.332 15.288 23.211 17.812 25.04 18.349 Z M 12.271 15.142 C 12.428 13.27 11.617 10.803 9.667 10.623 C 5.996 10.483 5.304 18.192 8.638 19.192 C 10.549 19.685 12.067 17.746 12.271 15.142 Z M 16.613 15.873 C 18.443 16.411 20.546 14.764 21.298 12.206 C 22.929 5.995 16.645 4.148 14.652 10.253 C 13.901 12.811 14.779 15.334 16.613 15.873 Z" fill="currentColor"></path>
    </g>
  </svg>
);

export const BouncingElement = ({
  children,
  className,
  axis = "rotate",
  startVal = 12,
  endVal = 90,
  stiffness = 60,
  damping = 8,
  pause = 600,
  scaleUp = 1.3,
  scaleDown = 1,
}: {
  children: React.ReactNode;
  className?: string;
  axis?: "rotate" | "x" | "y";
  startVal?: number | string;
  endVal?: number | string;
  stiffness?: number;
  damping?: number;
  pause?: number;
  scaleUp?: number;
  scaleDown?: number;
}) => {
  const controls = useAnimation();

  useEffect(() => {
    let isMounted = true;

    const sequence = async () => {
      while (isMounted) {
        // Forward (scale up)
        await controls.start({
          [axis]: endVal,
          scale: scaleUp,
          transition: {
            [axis]: { type: "spring", stiffness, damping },
            scale: { type: "spring", stiffness: stiffness * 0.8, damping: damping + 2 },
          },
        } as any);

        await new Promise((r) => setTimeout(r, pause));
        if (!isMounted) break;

        // Backward (scale down)
        await controls.start({
          [axis]: startVal,
          scale: scaleDown,
          transition: {
            [axis]: { type: "spring", stiffness, damping },
            scale: { type: "spring", stiffness: stiffness * 0.8, damping: damping + 2 },
          },
        } as any);

        await new Promise((r) => setTimeout(r, pause));
      }
    };

    sequence();
    return () => {
      isMounted = false;
    };
  }, [controls, axis, startVal, endVal, stiffness, damping, pause, scaleUp, scaleDown]);

  return (
    <motion.div
      animate={controls}
      initial={{ [axis]: startVal, scale: scaleDown }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#F9F8F6] pt-[180px] pb-32 min-h-screen flex items-center">
      {/* Background Graphic Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <BouncingElement
          axis="rotate"
          startVal={10}
          endVal={40}
          className="absolute top-[75%] max-md:top-[24%] max-md:left-[5%] left-[15%] w-20 h-20 text-primary/70"
        >
          <PawPrint className="w-full h-full" />
        </BouncingElement>
        <BouncingElement
          axis="rotate"
          startVal={0}
          endVal={-30}
          className="absolute top-[60%] max-md:top-[63%] max-md:left-[10%] left-[20%] w-10 h-10 text-primary/70"
        >
          <PawPrint className="w-full h-full" />
        </BouncingElement>
        <BouncingElement
          axis="rotate"
          startVal={10}
          endVal={40}
          className="absolute top-[62%] max-md:top-[75%] max-md:right-[0%] right-[20%] w-20 h-20 text-primary/70"
        >
          <PawPrint className="w-full h-full" />
        </BouncingElement>
        <BouncingElement
          axis="rotate"
          startVal={0}
          endVal={-30}
          className="absolute top-[73%] max-md:top-[45%] max-md:right-[11%] right-[13%] w-10 h-10 text-primary/70"
        >
          <PawPrint className="w-full h-full" />
        </BouncingElement>

      </div>

      <div className="container mx-auto px-6 pt-10 relative z-10 flex flex-col items-center text-center">
        {/* <FadeInUp>
          <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white shadow-sm border border-gray-100 text-[#987D6B] font-medium text-sm mb-10">
            <span className="w-2.5 h-2.5 rounded-full bg-[#987D6B]" />
            Top Pet Care Center
          </div>
        </FadeInUp> */}

        <FadeInUp delay={0.1}>
          <h1 className="text-[56px] md:text-[88px] font-heading leading-[1.05] max-w-4xl mb-8 text-[#1A1A1A]">
            Best Pals for<br />Your Paw Pals
          </h1>
        </FadeInUp>

        <FadeInUp delay={0.2}>
          <p className="text-lg px-5 md:text-[22px] leading-relaxed text-[#666666] max-w-2xl mb-12 mx-auto">
            Your Trusted Partner in Pet Care, Offering Tailored Services to Ensure the Health, Happiness, and Well-Being of Your Beloved Furry Companions.
          </p>
        </FadeInUp>

        <FadeInUp delay={0.3}>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="#" className="transition-transform hover:scale-105 active:scale-95">
              <Image src="/appleButton.svg" alt="Download on the App Store" width={180} height={54} className="h-14 w-auto" />
            </Link>
            <Link href="#" className="transition-transform hover:scale-105 active:scale-95">
              <Image src="/googleButton.svg" alt="Get it on Google Play" width={180} height={54} className="h-14 w-auto" />
            </Link>
          </div>
        </FadeInUp>
      </div>

      {/* Floating Elements / Pet Images */}
      {/* Cat on Left */}
      <motion.div
        className="absolute bottom-0 left-0 max-xl:-left-10 max-md:-left-20 w-[600px] h-[600px] max-xl:w-[450px] max-xl:h-[450px] max-lg:w-[350px] max-lg:h-[350px] max-md:w-64 max-md:h-64  z-10 pointer-events-none"
      >
        <Image src="/heroCat (3).png" loading="eager" alt="Cat" fill className="object-contain object-left drop-shadow-2xl" sizes="(max-width: 768px) 100vw, 33vw" />
      </motion.div>

      {/* Dog on Right */}
      <motion.div
        className="absolute top-1/2 -translate-y-1/2 max-md:top-[60%] -right-[23%] max-sm:-right-[53%] w-[700px] h-[700px] max-xl:w-[450px] max-xl:h-[450px] max-lg:w-[350px] max-lg:h-[350px] max-md:w-64 max-md:h-64 z-10 pointer-events-none"
      >
        <Image src="/heroDog (2).png" alt="Dog" fill className="object-contain object-right drop-shadow-2xl" sizes="(max-width: 768px) 100vw, 33vw" />
      </motion.div>
    </section>
  );
}
