"use client";

import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/AnimationProvider";
import { 
  ShieldCheck, 
  Heart, 
  Stethoscope, 
  Truck, 
  ShoppingBag, 
  Coffee, 
  Apple 
} from "lucide-react";

const partners = [
  { name: "SafePet Insurance", icon: ShieldCheck },
  { name: "Global Pet Connect", icon: Heart },
  { name: "MediVet Solutions", icon: Stethoscope },
  { name: "FastTrack Logistics", icon: Truck },
  { name: "FurrCircle Shop", icon: ShoppingBag },
  { name: "Wellness Cafe", icon: Coffee },
];

export function Partners() {
  return (
    <section id="partners" className="py-32 max-md:py-10 max-md:pb-20 bg-[#F9F8F6] bg-[url('/partnerBg.svg')] bg-cover bg-bottom bg-no-repeat">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex flex-col items-center text-center mb-8">
          <FadeInUp>
            <h2 className="text-4xl md:text-7xl font-heading text-foreground mb-4">Our Partners</h2>
          </FadeInUp>
        </div>

        <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 gap-8">
          {partners.map((partner, index) => (
            <StaggerItem key={index}>
              <div className="group flex flex-col items-center justify-center p-8 bg-white/50 backdrop-blur-sm rounded-3xl border border-border hover:border-primary/30 transition-all hover:-translate-y-1 hover:shadow-lg mt-10">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  <partner.icon className="w-8 h-8 text-primary group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="font-heading text-xl text-foreground group-hover:text-primary transition-colors duration-300">
                  {partner.name}
                </h3>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
