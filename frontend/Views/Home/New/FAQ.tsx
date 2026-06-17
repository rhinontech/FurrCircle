"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ArrowDown, PawPrint } from "lucide-react";

const faqs = [
  {
    question: "What is FurrCircle?",
    answer: "FurrCircle is India's social network for pet lovers. You can share posts and stories, match your pet for playdates or adoption, track health records, book vets, discover local events, and chat with other pet parents — all in one free app.",
  },
  {
    question: "How does pet matching work?",
    answer: "Pet matching works like a swipe card interface. You can match in three modes: Playdate (find pets to hang out with), Adoption (find pets looking for a home), and Breed (connect for responsible breeding). When it's a mutual match, you can start chatting instantly.",
  },
  {
    question: "What are Circles on FurrCircle?",
    answer: "Circles are local, interest-based communities — like Dogs, Cats, Rescue, Health, and Training. Join circles near you to ask and answer questions, share advice, and connect with pet parents in your city.",
  },
  {
    question: "Is FurrCircle free to use?",
    answer: "Yes, FurrCircle is completely free to download and use on both iOS and Android.",
  },
  {
    question: "What pets does FurrCircle support?",
    answer: "FurrCircle supports all kinds of pets — dogs, cats, rabbits, parrots, turtles, squirrels, and more. Any pet parent is welcome.",
  },
  {
    question: "How do I track my pet's health records?",
    answer: "Each pet gets a Health Passport inside the app where you can log vaccines, vitals, medications, allergies, and insurance info. You can also set reminders so you never miss a dose or vet visit.",
  },
  {
    question: "Can I find local vets and events on FurrCircle?",
    answer: "Yes! The Discover tab lets you find verified vets near you and book appointments. The Events section shows local adoption drives, pet meetups, training sessions, and playdates in your city.",
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
    <section id="faq" className="relative py-24 overflow-hidden">
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
