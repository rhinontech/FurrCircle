"use client";

import { FadeInUp } from "@/components/AnimationProvider";

export function ValuesGrid() {
  return (
    <section className="py-32 bg-[#F9F8F6]">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex flex-col items-center text-center mb-16">
          <FadeInUp>
            <h2 className="text-4xl md:text-5xl font-heading text-foreground mb-4">Our Values</h2>
          </FadeInUp>
          <FadeInUp delay={0.1}>
            <p className="text-muted-foreground max-w-2xl">
              We are guided by strong principles to ensure the best care for your pets.
            </p>
          </FadeInUp>
        </div>

        {/* Bento Box Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          
          {/* Compassion - Tall Vertical */}
          <FadeInUp
            delay={0.2}
            className="md:col-span-1 md:row-span-2 bg-secondary rounded-3xl p-10 flex flex-col justify-center transition-transform hover:-translate-y-2 hover:shadow-xl group"
          >
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mb-6">
               <span className="text-primary font-bold text-2xl">C</span>
            </div>
            <h3 className="text-3xl font-heading mb-4 text-foreground">Compassion</h3>
            <p className="text-muted-foreground leading-relaxed">
              We approach every pet with empathy and kindness, ensuring their comfort and well-being.
            </p>
          </FadeInUp>

          {/* Excellence - Small Horizontal */}
          <FadeInUp
            delay={0.3}
            className="md:col-span-1 bg-card border border-border rounded-3xl p-8 transition-transform hover:-translate-y-2 hover:shadow-xl"
          >
            <h3 className="text-2xl font-heading mb-3 text-foreground">Excellence</h3>
            <p className="text-muted-foreground">
              We strive for excellence in all we do, from medical to service.
            </p>
          </FadeInUp>

          {/* Trust - Small Horizontal */}
          <FadeInUp
            delay={0.4}
            className="md:col-span-1 bg-card border border-border rounded-3xl p-8 transition-transform hover:-translate-y-2 hover:shadow-xl"
          >
            <h3 className="text-2xl font-heading mb-3 text-foreground">Trust</h3>
            <p className="text-muted-foreground">
              Your trust is paramount, and we work tirelessly to maintain it.
            </p>
          </FadeInUp>

          {/* Community - Wide Horizontal */}
          <FadeInUp
            delay={0.5}
            className="md:col-span-2 bg-primary text-primary-foreground rounded-3xl p-10 flex flex-col justify-center transition-transform hover:-translate-y-2 hover:shadow-xl"
          >
            <h3 className="text-3xl font-heading mb-4 text-primary-foreground">Community</h3>
            <p className="text-primary-foreground/90 leading-relaxed max-w-xl">
              We're proud to be a part of the local pet-loving community, supporting pet owners like you.
            </p>
          </FadeInUp>

        </div>
      </div>
    </section>
  );
}
