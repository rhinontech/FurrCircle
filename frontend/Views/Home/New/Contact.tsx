"use client";

import { AnimatedHeading } from "@/components/AnimationProvider";
import { submitContactLead } from "@/lib/contactLeads";
import { motion } from "framer-motion";
import Image from "next/image";
import { type FormEvent, useState } from "react";

export function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "success" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState("");

  const handleChange = (field: "name" | "email" | "phone" | "message", value: string) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitState("idle");
    setSubmitMessage("");

    try {
      await submitContactLead({
        ...formData,
        source: "home-contact",
        pagePath: typeof window !== "undefined" ? window.location.pathname : "/",
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        message: "",
      });
      setSubmitState("success");
      setSubmitMessage("Thanks for reaching out. Our team will get back to you soon.");
    } catch (error) {
      setSubmitState("error");
      setSubmitMessage(error instanceof Error ? error.message : "Failed to submit your message.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Decorative Floating Circles */}
      {/* Left Circle (Green) */}
      <motion.div
        initial={{ opacity: 0, x: -100 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="absolute left-[5%] top-[10%] w-48 h-48 md:w-64 md:h-64 rounded-full bg-[#53AF54] overflow-hidden flex items-center justify-center shadow-2xl z-20 max-md:hidden"
      >
        {/*
          PARROT IMAGE PLACEHOLDER
          Uncomment the following Image tag and add your Parrot image URL:
        */}

        <Image
          src="/parrot.avif"
          alt="Parrot"
          fill
          sizes="256px"
          className="object-contain p-8 mt-5"
        />

        {/* <span className="text-white/20 font-black text-xs uppercase tracking-widest text-center px-4 select-none">
          Parrot Placeholder
        </span> */}
      </motion.div>

      {/* Right Circle (Purple) */}
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="absolute max-md:hidden right-[5%] bottom-[10%] w-40 h-40 md:w-56 md:h-56 rounded-full bg-[#9D8FE4] overflow-hidden flex items-center justify-center shadow-2xl z-20"
      >
        {/*
          RABBIT IMAGE PLACEHOLDER
          Uncomment the following Image tag and add your Rabbit image URL:
        */}

        <Image
          src="/rabbit.avif"
          alt="Rabbit"
          fill
          sizes="224px"
          className="object-contain !h-[90%] mt-10"
        />

        {/* <span className="text-white/20 font-black text-xs uppercase tracking-widest text-center px-4 select-none">
          Rabbit Placeholder
        </span> */}
      </motion.div>

      {/* Background Paws */}
      <div className="absolute max-md:hidden top-96 left-40 w-34 h-34 rotate-90 pointer-events-none opacity-100">
        <Image src='/pawprint1.png' alt="Paw Print" fill sizes="136px" className="object-contain" />
      </div>
      <div className="absolute max-md:hidden top-96 right-40 w-34 h-34 pointer-events-none opacity-100">
        <Image src='/pawprint1.png' alt="Paw Print" fill sizes="136px" className="object-contain" />
      </div>

      <div className="max-w-xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 px-4">
          <AnimatedHeading
            text="STILL HAVE QUESTIONS? \n GET IN TOUCH."
            className="text-5xl md:text-6xl font-black font-heading mb-6 text-[#1A1A1A] uppercase tracking-tight leading-[1.1]"
          />
        </div>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1A1A1A] px-1 uppercase tracking-wider">Name</label>
                <input
                  type="text"
                  placeholder="Jane Smith"
                  value={formData.name}
                  onChange={(event) => handleChange("name", event.target.value)}
                  className="w-full px-6 py-4 rounded-xl border-none bg-gray-100 focus:ring-2 focus:ring-[#87CEEB] text-[#1A1A1A] placeholder:text-gray-400 outline-none transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1A1A1A] px-1 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  placeholder="jane@example.com"
                  value={formData.email}
                  onChange={(event) => handleChange("email", event.target.value)}
                  className="w-full px-6 py-4 rounded-xl border-none bg-gray-100 focus:ring-2 focus:ring-[#87CEEB] text-[#1A1A1A] placeholder:text-gray-400 outline-none transition-all"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1A1A1A] px-1 uppercase tracking-wider">Phone</label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(event) => handleChange("phone", event.target.value)}
                className="w-full px-6 py-4 rounded-xl border-none bg-gray-100 focus:ring-2 focus:ring-[#87CEEB] text-[#1A1A1A] placeholder:text-gray-400 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1A1A1A] px-1 uppercase tracking-wider">Message</label>
              <textarea
                rows={5}
                placeholder="Your message..."
                value={formData.message}
                onChange={(event) => handleChange("message", event.target.value)}
                className="w-full px-6 py-4 rounded-xl border-none bg-gray-100 focus:ring-2 focus:ring-[#87CEEB] text-[#1A1A1A] placeholder:text-gray-400 outline-none transition-all resize-none"
                required
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
              className="w-full py-5 rounded-full bg-[#87CEEB] text-[#1A1A1A] font-black text-xl uppercase tracking-widest shadow-lg hover:shadow-xl transition-all mt-4"
            >
              {isSubmitting ? "Sending..." : "Submit"}
            </motion.button>
            {submitMessage && (
              <p className={`text-sm font-medium ${submitState === "success" ? "text-emerald-600" : "text-rose-600"}`}>
                {submitMessage}
              </p>
            )}
          </form>
        </motion.div>
      </div>
    </section>
  );
}
