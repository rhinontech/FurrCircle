import React, { ReactNode, useEffect } from "react";
import { motion, Variants, useAnimation } from "framer-motion";

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

interface AnimationProviderProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  yOffset?: number;
  duration?: number;
  once?: boolean;
}


export function FadeInUp({
  children,
  delay = 0,
  className = "",
  yOffset = 40,
  duration = 0.6,
  once = true,
}: AnimationProviderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-100px" }}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({
  children,
  className = "",
  delayChildren = 0.2,
  staggerChildren = 0.1,
}: {
  children: ReactNode;
  className?: string;
  delayChildren?: number;
  staggerChildren?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-100px" }}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren,
            delayChildren,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = "",
  yOffset = 40,
}: {
  children: ReactNode;
  className?: string;
  yOffset?: number;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: yOffset },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedHeading({
  text,
  className = "",
  delay = 0,
  tag = "h2",
  stagger = 0.2,
}: {
  text: string;
  className?: string;
  delay?: number;
  tag?: "h1" | "h2" | "h3";
  stagger?: number;
}) {
  const lines = text.split(/\\n|\n/);
  const MotionTag = motion[tag] as any;

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <MotionTag
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-100px" }}
      className={className}
    >
      {lines.map((line, lineIndex) => (
        <span key={lineIndex} className="block last:mb-0">
          {(line || "").split(" ").map((word, wordIndex) => (
            <motion.span
              key={wordIndex}
              variants={item}
              className="inline-block mr-[0.25em] last:mr-0"
            >
              {word}
            </motion.span>
          ))}
        </span>
      ))}
    </MotionTag>
  );
}
