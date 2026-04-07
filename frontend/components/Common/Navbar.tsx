"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "About", href: "/about-us" },
    { name: "Services", href: "/services" },
    { name: "Contact", href: "/contacts" },
  ];

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-[#F9F8F6]/70 backdrop-blur-md  transition-all duration-300">
        <nav className="container mx-auto px-6 md:px-10 h-[70px] md:h-[90px] flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 relative z-[60]">
            <svg width="30" height="24" viewBox="0 0 34 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="md:w-[34px] md:h-[28px]">
              <path d="M12.98 12.01L14.47 5.97C14.71 4.97 13.9 4 12.87 4H8.4C6.52 4 5 5.52 5 7.4V12.01C5 12.56 5.44 13.01 6 13.01H11.98C12.54 13.01 12.98 12.56 12.98 12.01Z" fill="#1A1A1A" />
              <path d="M22.02 12.01L20.53 5.97C20.29 4.97 21.1 4 22.13 4H26.6C28.48 4 30 5.52 30 7.4V12.01C30 12.56 29.56 13.01 29 13.01H23.02C22.46 13.01 22.02 12.56 22.02 12.01Z" fill="#1A1A1A" />
              <circle cx="17.5" cy="19.5" r="3.5" fill="#1A1A1A" />
              <circle cx="11.5" cy="23.5" r="2.5" fill="#1A1A1A" />
              <circle cx="23.5" cy="23.5" r="2.5" fill="#1A1A1A" />
              <circle cx="14.5" cy="18.5" r="1.5" fill="#F9F8F6" />
              <circle cx="20.5" cy="18.5" r="1.5" fill="#F9F8F6" />
            </svg>
            <span className="text-2xl md:text-3xl font-heading tracking-tight text-[#1A1A1A]">PetPals<span className="text-[#987D6B] text-[8px] relative -top-3">●</span></span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-[15px] font-medium text-[#1A1A1A] hover:text-[#987D6B] transition-colors"
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
            <button className="hidden sm:inline-flex items-center justify-center h-10 md:h-11 px-6 md:px-8 rounded-full text-[14px] md:text-[15px] font-medium bg-[#987D6B] text-white hover:bg-[#8A7160] transition-colors">
              Book Now
            </button>

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
                  <button
                    className="w-full h-14 rounded-full text-lg font-medium bg-[#987D6B] text-white hover:bg-[#8A7160] transition-colors shadow-lg shadow-primary/20"
                    onClick={() => setIsOpen(false)}
                  >
                    Book Now
                  </button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
