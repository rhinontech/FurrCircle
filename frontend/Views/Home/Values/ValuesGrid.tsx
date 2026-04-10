"use client";

import { FadeInUp } from "@/components/AnimationProvider";

export function ValuesGrid() {
  return (
    <section className="py-32 max-md:py-10 px-5 bg-blue-200">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col items-center text-center mb-16">
          <FadeInUp>
            <h2 className="text-4xl md:text-6xl font-heading text-foreground mb-4">Our Values</h2>
          </FadeInUp>
          {/* <FadeInUp delay={0.1}>
            <p className="text-muted-foreground max-w-2xl">
              We are guided by strong principles to ensure the best care for your pets.
            </p>
          </FadeInUp> */}
        </div>

        {/* Bento Box Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
          
          {/* Compassion - Tall Vertical */}
          <FadeInUp
            delay={0.2}
            className="md:col-span-1 group md:row-span-2 bg-[url('/values1.png')] bg-cover bg-center bg-no-repeat rounded-3xl py-5 px-10 flex flex-col justify-between transition-transform hover:-translate-y-2 hover:shadow-xl group text-white relative overflow-hidden"
          >
            <div className=" w-fit px-8 py-3 rounded-full border-1 group-hover:bg-white transition-all duration-300 border-white  flex items-center justify-center mb-10">
               <h3 className="text-xl group-hover:text-black transition-colors duration-300 font-heading text-white">Compassion</h3>
            </div>
            
            <p className="text-white text-lg leading-relaxed">
              We approach every pet with empathy and kindness, ensuring their comfort and well-being.
            </p>
          </FadeInUp>

          {/* Excellence - Small Horizontal */}
          <FadeInUp
            delay={0.3}
            className="md:col-span-1 group bg-card bg-[url('/values2.png')] bg-cover bg-center bg-no-repeat rounded-3xl py-5 px-10 transition-transform hover:-translate-y-2 hover:shadow-xl"
          >
            <div className=" w-fit px-8 py-3 rounded-full border-1 group-hover:bg-white transition-all duration-300 border-white  flex items-center justify-center mb-10">
               <h3 className="text-xl font-heading group-hover:text-black transition-colors duration-300 text-white">Excellence</h3>
            </div>
            <p className="text-white text-lg leading-relaxed">
              We strive for excellence in all we do, from medical to service.
            </p>
          </FadeInUp>

          {/* Trust - Small Horizontal */}
          <FadeInUp
            delay={0.4}
            className="md:col-span-1 group bg-[url('/values3.png')] bg-cover bg-center bg-no-repeat rounded-3xl py-5 px-10  transition-transform hover:-translate-y-2 hover:shadow-xl"
          >
            <div className=" w-fit px-8 py-3 rounded-full border-1 group-hover:bg-white transition-all duration-300 border-white  flex items-center justify-center mb-10">
               <h3 className="text-xl font-heading group-hover:text-black transition-colors duration-300 text-white">Trust</h3>
            </div>
            <p className="text-white text-lg leading-relaxed">
              Your trust is paramount, and we work tirelessly to maintain it.
            </p>
          </FadeInUp>

          {/* Community - Wide Horizontal */}
          <FadeInUp
            delay={0.5}
            className="md:col-span-2 group bg-[url('/values4.png')] bg-cover bg-center bg-no-repeat rounded-3xl py-5 px-10  flex flex-col justify-center transition-transform hover:-translate-y-2 hover:shadow-xl"
          >
            <div className=" w-fit px-8 py-3 rounded-full border-1 group-hover:bg-white transition-all duration-300 border-white  flex items-center justify-center mb-10">
               <h3 className="text-xl font-heading group-hover:text-black transition-colors duration-300 text-white">Community</h3>
            </div>
            <p className="text-white text-lg leading-relaxed">
              We're proud to be a part of the local pet-loving community, supporting pet owners like you.
            </p>
          </FadeInUp>

        </div>
      </div>
    </section>
  );
}
