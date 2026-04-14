"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Services", href: "#services" },
    { name: "Patients", href: "#patients" },
    { name: "Reviews", href: "#reviews" },
  ];

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-[#fffbf5]/70 border-1 border-b backdrop-blur-md  transition-all duration-300">
        <nav className="container mx-auto px-6 md:px-10 h-[70px] md:h-[90px] flex items-center justify-between relative">
          {/* Logo */}
          <Link href="/" className="relative z-[60] block">
            <Image
              src="/logo/furrcircle_light_logo.png"
              alt="FurrCircle"
              width={150}
              height={100}
              className="w-auto h-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex absolute right-20  items-center gap-20">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-[15px] font-semibold text-[#1A1A1A] hover:text-blue-400 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 md:gap-6 relative z-[60]">
            {/* <button className="flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-[#EDECED] text-[#1A1A1A] hover:bg-[#E5E4E5] transition-colors">
              <Search className="w-5 h-5 md:w-5 md:h-5" strokeWidth={2.5} />
            </button> */}
            {/* <button className="hidden sm:inline-flex items-center justify-center h-10 md:h-11 px-6 md:px-8 rounded-full text-[14px] md:text-[15px] font-medium bg-[#987D6B] text-white hover:bg-[#8A7160] transition-colors">
              Book Now
            </button> */}

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-section-bg text-black transition-all active:scale-95"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle Menu"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "100vh" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-0 z-50 bg-[#F9F8F6] overflow-hidden md:hidden"
            >
              <div className="flex flex-col items-center justify-center h-full gap-8 px-8">
                {navLinks.map((link, idx) => (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * idx + 0.2 }}
                  >
                    <Link
                      href={link.href}
                      className="text-4xl font-heading text-[#1A1A1A] hover:text-[#987D6B] transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                ))}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 w-full max-w-xs"
                >
                  {/* <button
                    className="w-full h-14 rounded-full text-lg font-medium bg-[#987D6B] text-white hover:bg-[#8A7160] transition-colors shadow-lg shadow-primary/20"
                    onClick={() => setIsOpen(false)}
                  >
                    Book Now
                  </button> */}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
