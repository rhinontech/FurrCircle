import React, { useState } from "react";
import { Link } from "expo-router";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Features", href: "/web#services" },
    { name: "Patients", href: "/web#patients" },
    { name: "Reviews", href: "/web#reviews" },
    { name: "About Us", href: "/web/about" },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.includes("#")) {
      const id = href.split("#")[1];
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        const offset = 100;
        const top = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }
    setIsOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-[#fffbf5]/70 border-b border-black/5 backdrop-blur-md transition-all duration-300">
        <nav className="container mx-auto px-6 md:px-10 h-[70px] md:h-[90px] flex items-center justify-between relative">
          {/* Logo */}
          <Link href={"/web" as any} className="relative z-[60] block">
            <img
              src="/logo/furrcircle_light_logo.webp"
              alt="FurrCircle"
              className="h-10 w-auto object-contain"
            />
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex absolute right-72 items-center gap-10">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-[15px] font-semibold text-[#1A1A1A] hover:text-blue-400 transition-colors"
                onClick={(e) => handleNavClick(e as any, link.href)}
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 md:gap-6 relative z-[60]">
            <Link
              href={"/login" as any}
              className="hidden sm:inline-flex items-center justify-center h-10 px-6 rounded-full text-[14px] md:text-[15px] font-medium border border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link
              href={"/signup" as any}
              className="hidden sm:inline-flex items-center justify-center h-10 px-6 rounded-full text-[14px] md:text-[15px] font-medium bg-[#987D6B] text-white hover:bg-[#8A7160] transition-colors"
            >
              Sign Up
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-black/5 text-black transition-all active:scale-95"
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
                    <a
                      href={link.href}
                      className="text-4xl font-black text-[#1A1A1A] hover:text-[#987D6B] transition-colors uppercase tracking-tight"
                      onClick={(e) => handleNavClick(e as any, link.href)}
                    >
                      {link.name}
                    </a>
                  </motion.div>
                ))}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-col gap-4 w-full max-w-xs mt-4"
                >
                  <a
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center h-14 rounded-full text-lg font-bold border border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors"
                  >
                    Login
                  </a>
                  <a
                    href="/signup"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center h-14 rounded-full text-lg font-bold bg-[#987D6B] text-white hover:bg-[#8A7160] transition-colors shadow-lg"
                  >
                    Sign Up
                  </a>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
