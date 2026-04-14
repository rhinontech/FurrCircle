"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ArrowDown, PawPrint } from "lucide-react";

const faqs = [
  {
    question: "What are your operating hours?",
    answer: "Our standard hours are Monday-Friday 8:00 AM - 7:00 PM, and Saturday 9:00 AM - 5:00 PM. We are closed on Sundays for routine visits but have emergency on-call staff available.",
  },
  {
    question: "Do you offer emergency veterinary services?",
    answer: "Yes, we provide 24/7 emergency care for critical situations. During regular hours, please call us while on your way. After hours, follow the instructions on our emergency line.",
  },
  {
    question: "How do I schedule and appointment?",
    answer: "You can schedule an appointment by calling us directly at 1-800-PET-CARE or by using our online booking system available on our website.",
  },
  {
    question: "What types of pets do you treat?",
    answer: "We treat a wide variety of pets, including dogs, cats, rabbits, guinea pigs, and other small domestic animals.",
  },
  {
    question: "Do you provide vaccinations and preventive care?",
    answer: "Absolutely! We offer comprehensive vaccination programs and preventive care plans tailored to your pet's specific needs and lifestyle.",
  },
];

const backgroundPaws = [
  { top: "15%", right: "12%", rotate: 20, size: 40 },
  { top: "22%", right: "18%", rotate: -10, size: 30 },
  { top: "18%", right: "25%", rotate: 15, size: 35 },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-24 bg-[#F3F0E9] overflow-hidden">
      {/* Background Paws */}
      {backgroundPaws.map((paw, i) => (
        <div
          key={i}
          className="absolute text-gray-300 pointer-events-none opacity-40 z-0"
          style={{
            top: paw.top,
            right: paw.right,
            transform: `rotate(${paw.rotate}deg)`,
          }}
        >
          <PawPrint size={paw.size} />
        </div>
      ))}

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-black font-heading mb-6 text-[#1A1A1A] uppercase tracking-tight leading-[1.1]"
          >
            FREQUENTLY ASKED <br className="hidden md:block" /> QUESTIONS
          </motion.h2>
        </div>

        {/* FAQ List */}
        <div className="max-w-5xl mx-auto space-y-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-xl overflow-hidden border border-[#1A1A1A]"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full p-6 flex items-center justify-between text-left transition-colors hover:bg-gray-50 group"
              >
                <span className="text-lg md:text-2xl font-bold text-[#1A1A1A]">
                  {faq.question}
                </span>
                <motion.div
                  animate={{ rotate: openIndex === i ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-[#1A1A1A]"
                >
                  <ArrowDown className="w-6 h-6" />
                </motion.div>
              </button>

              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="px-8 pb-8 text-[#1A1A1A]/70 text-lg md:text-xl leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
