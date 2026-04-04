"use client";

import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/AnimationProvider";
import { ArrowRight, Search, HeartPulse, Home, Bone, Scissors, CalendarHeart } from "lucide-react";
import Link from "next/link";
import { HeartHandshake, BadgeCheck, Handshake } from "lucide-react";

export const values = [
  {
    icon: HeartHandshake,
    title: "Compassion",
    content:
      "We approach every pet with empathy and kindness, ensuring their comfort and well-being. Our caring touch extends to all animals, from the tiniest hamster to the largest dog, creating a safe and loving environment where their happiness and health flourish.",
  },
  {
    icon: BadgeCheck,
    title: "Excellence",
    content:
      "We uphold uncompromising standards in every aspect of our service, from meticulous medical care to unparalleled customer service. Our dedication to excellence is a promise that your pet will receive the best, ensuring their well-being and your peace of mind.",
  },
  {
    icon: Handshake,
    title: "Trust",
    content:
      "Your trust is paramount in our relationship. We are committed to maintaining it through unwavering transparency, reliability, and clear communication. Count on us to be your dependable partner in pet care, always putting your pet’s best interests first.",
  },
];

export function Values() {
  return (
    <section id="services" className="py-32 z-10 bg-[url('/curveBg.svg')] bg-cover bg-top bg-no-repeat">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex flex-col mb-16">
          <FadeInUp>
            <h2 className="text-4xl md:text-7xl font-heading text-foreground mb-4">Our Values</h2>
          </FadeInUp>
          {/* <FadeInUp delay={0.1}>
            <p className="text-muted-foreground max-w-2xl">
              We provide a comprehensive range of premium services to ensure your pets are happy, healthy, and well-cared for.
            </p>
          </FadeInUp> */}
        </div>
        <div className="flex gap-5 max-md:flex-col justify-between">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <StaggerItem key={index}>
                <Link href={'#'} className="block h-full group">
                  <div className="h-full flex flex-col gap-5 bg-card p-7 rounded-3xl border border-border transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:bg-primary">
                    <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center group-hover:bg-primary-foreground/20 transition-colors">
                      <Icon className="w-7 h-7 text-white group-hover:text-primary-foreground transition-colors" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-heading text-foreground mb-4 group-hover:text-primary-foreground transition-colors">
                        {value.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed group-hover:text-primary-foreground/90 transition-colors">
                        {value.content}
                      </p>
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </div>
      </div>
    </section>
  );
}
