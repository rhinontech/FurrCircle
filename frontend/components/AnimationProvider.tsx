"use client";

import { motion, Variants } from "framer-motion";
import { ReactNode } from "react";

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
  // Split by both literal newlines and the "\n" string sequence
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
