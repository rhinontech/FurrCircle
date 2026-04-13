"use client";

import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/AnimationProvider";
import { ArrowRight, Search, HeartPulse, Home, Bone, Scissors, CalendarHeart } from "lucide-react";
import Link from "next/link";

const services = [
  {
    title: "Digital Health Vault",
    description: "Securely store and zoom into medical reports with our high-fidelity document viewer.",
    icon: Search, // Approximate match for discovery/lookup
    link: "#",
  },
  {
    title: "Vaccine Monitor",
    description: "State-of-the-art tracking for vaccinations with automated reminders for next doses.",
    icon: HeartPulse,
    link: "#",
  },
  {
    title: "Professional Network",
    description: "Find and connect with top-rated veterinarians and specialists in your area.",
    icon: Home, // Approximate match for clinic/home
    link: "#",
  },
  {
    title: "Community Hub",
    description: "Engagement with a global network of pet lovers. Share stories and get expert advice.",
    icon: Bone,
    link: "#",
  },
  {
    title: "Wellness Tracking",
    description: "Monitor vital signs, weight, and daily medications to ensure peak wellness.",
    icon: Scissors, // Approximate match for grooming/care
    link: "#",
  },
  {
    title: "Unified Profiles",
    description: "A single digital identity for all your companions, accessible anytime, anywhere.",
    icon: CalendarHeart,
    link: "#",
  },
];

export function Services() {
  return (
    <section id="services" className="py-32 bg-[#F9F8F6] bg-[url('/curveBg.svg')] bg-cover bg-top bg-no-repeat">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex flex-col items-center text-center mb-16">
          <FadeInUp>
            <h2 className="text-4xl md:text-5xl font-heading text-foreground mb-4">Our Pet Care Solutions</h2>
          </FadeInUp>
          {/* <FadeInUp delay={0.1}>
            <p className="text-muted-foreground max-w-2xl">
              We provide a comprehensive range of premium services to ensure your pets are happy, healthy, and well-cared for.
            </p>
          </FadeInUp> */}
        </div>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <StaggerItem key={index}>
                <Link href={service.link} className="block h-full group">
                  <div className="h-full flex gap-5 bg-card p-7 rounded-3xl border border-border transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:bg-primary">
                    <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-6 group-hover:bg-primary-foreground/20 transition-colors">
                      <Icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-heading text-foreground mb-4 group-hover:text-primary-foreground transition-colors">
                        {service.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed group-hover:text-primary-foreground/90 transition-colors">
                        {service.description}
                      </p>
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
