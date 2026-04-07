"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { FadeInUp } from "@/components/AnimationProvider";

const galleryImages = [
  "/gallery/family1.png",
  "/gallery/family2.png",
  "/gallery/family3.png",
  "/gallery/family4.png",
  "/gallery/family5.png",
  "/gallery/family6.png",
];

// Duplicate for infinite effect to ensure seamless scrolling
const allImages = [...galleryImages, ...galleryImages];

export function Gallery() {
  return (
    <section className="py-32 overflow-hidden bg-white">
      <div className="container mx-auto px-6 max-w-7xl mb-16">
        <div className="flex flex-col items-center text-center">
          <FadeInUp>
            <h2 className="text-4xl md:text-7xl font-heading text-foreground mb-6">
              Our PetPals Family in Pictures
            </h2>
          </FadeInUp>
          <FadeInUp delay={0.1}>
            <p className="text-muted-foreground text-lg md:text-xl max-w-3xl">
              A Glimpse into the Joyful Moments We Share with Your Beloved Pets
            </p>
          </FadeInUp>
        </div>
      </div>

      <div className="relative flex overflow-hidden">
        <motion.div
          className="flex gap-4 px-5"
          animate={{
            x: ["0%", "-50%"],
          }}
          transition={{
            duration: 40,
            ease: "linear",
            repeat: Infinity,
          }}
          style={{ width: "fit-content" }}
        >
          {allImages.map((src, index) => (
            <div
              key={index}
              className="relative w-[200px] h-[280px] md:w-[300px] md:h-[350px] rounded-[1rem] overflow-hidden shrink-0 shadow-lg"
            >
              <motion.div
                className="relative w-full h-full cursor-pointer"
                whileHover={{ scale: 1.08 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <Image
                  src={src}
                  alt={`Pet Family picture ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 300px, 450px"
                  className="object-cover"
                />
              </motion.div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
