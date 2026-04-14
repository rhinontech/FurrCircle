"use client";

import { AnimatedHeading } from "@/components/AnimationProvider";
import { motion } from "framer-motion";
import { Stethoscope, Siren, Syringe } from "lucide-react";

// Custom Tooth Icon since it's often missing in older Lucide versions
const ToothIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M7 11c.2-3.3 1.5-6 5-6s4.8 2.7 5 6c.2 4.4-1.2 8-5 8s-5.2-3.6-5-8Z" />
    <path d="M7 18.5c-.5-.3-1-1-1-1.5s.5-.8 1-1h.5" />
    <path d="M17 18.5c.5-.3 1-1 1-1.5s-.5-.8-1-1h-.5" />
  </svg>
);

const services = [
  {
    title: "ROUTINE CHECK-UPS",
    description: "Regular check-ups to ensure your pet's health and catch issues early.",
    icon: <Stethoscope className="w-8 h-8" />,
    color: "bg-[#53AF54]",
  },
  {
    title: "EMERGENCY CARE",
    description: "Immediate care for urgent situations to provide quick relief.",
    icon: <Siren className="w-8 h-8" />,
    color: "bg-[#EA5222]",
  },
  {
    title: "VACCINATIONS",
    description: "Vaccines to protect your pet from diseases and keep them healthy.",
    icon: <Syringe className="w-8 h-8" />,
    color: "bg-[#0CA2D0]",
  },
  {
    title: "DENTAL CARE",
    description: "Immediate care for urgent situations to provide quick relief.",
    icon: <ToothIcon className="w-8 h-8" />,
    color: "bg-[#FABC3F]",
  },
];

export function Services() {
  return (
    <section id="services" className="py-20 ">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-20">
          <AnimatedHeading
            text="OUR SERVICES"
            className="text-5xl md:text-7xl font-black font-heading mb-6 text-[#1A1A1A] uppercase tracking-tight"
          />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl md:text-2xl text-[#1A1A1A]/80 font-medium"
          >
            Comprehensive veterinary care for pets of all kinds
          </motion.p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-24 max-w-7xl mx-auto">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center text-center"
            >
              {/* Circular Icon Container */}
              <div className="relative group mb-10">
                {/* Layered Circular Icon */}
                <div className={`
                  w-32 h-32 rounded-full flex items-center justify-center text-white
                  ${service.color} shadow-2xl transition-transform duration-500 group-hover:scale-105
                  relative
                `}>
                  {/* Dashed Ring */}
                  <div className="absolute inset-3 border-2 border-dashed border-white/40 rounded-full" />
                  
                  {/* Inner Tinted Circle */}
                  <div className="w-20 h-20 rounded-full bg-white/25 flex items-center justify-center relative z-10 shadow-inner">
                    <div className="transition-transform duration-500 group-hover:scale-110">
                      {service.icon}
                    </div>
                  </div>
                </div>
              </div>

              {/* Text Content */}
              <h3 className="text-2xl font-black font-heading mb-1 text-[#1A1A1A] tracking-tight uppercase">
                {service.title}
              </h3>
              <p className="text-lg font-medium text-[#1A1A1A]/90 leading-relaxed">
                {service.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
