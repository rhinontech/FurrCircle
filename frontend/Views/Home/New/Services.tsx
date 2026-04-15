"use client";

import { AnimatedHeading } from "@/components/AnimationProvider";
import { motion } from "framer-motion";
import { ClipboardList, CalendarCheck, Bell, Users } from "lucide-react";

const services = [
  {
    title: "HEALTH RECORDS",
    description: "Store and access your pet's full medical history, vaccinations, and vitals anytime, anywhere.",
    icon: <ClipboardList className="w-8 h-8" />,
    color: "bg-[#53AF54]",
  },
  {
    title: "BOOK A VET",
    description: "Find verified veterinarians near you and book appointments in just a few taps.",
    icon: <CalendarCheck className="w-8 h-8" />,
    color: "bg-[#EA5222]",
  },
  {
    title: "SMART REMINDERS",
    description: "Never miss a vaccine, medication dose, or vet visit with automated reminders.",
    icon: <Bell className="w-8 h-8" />,
    color: "bg-[#0CA2D0]",
  },
  {
    title: "PET COMMUNITY",
    description: "Connect with fellow pet parents, share moments, and discover local pet events.",
    icon: <Users className="w-8 h-8" />,
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
            text="WHAT YOU CAN DO"
            className="text-5xl md:text-7xl font-black font-heading mb-6 text-[#1A1A1A] uppercase tracking-tight"
          />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl md:text-2xl text-[#1A1A1A]/80 font-medium"
          >
            Everything you need to keep your pet healthy and happy.
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
