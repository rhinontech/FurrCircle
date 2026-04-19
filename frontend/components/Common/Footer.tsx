"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FaFacebook, FaInstagram, FaTwitter, FaLinkedin } from "react-icons/fa";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/AnimationProvider";

const handleFooterLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
  if (href.startsWith("#")) {
    e.preventDefault();
    const el = document.getElementById(href.slice(1));
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 50;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }
};

export function Footer() {
  return (
    <footer className="bg-[url('/curveBg.svg')] bg-cover bg-top bg-no-repeat relative pt-32">
      {/* Exact Framer Wavy Divider */}
      {/* <div className="absolute top-0 left-0 w-full overflow-hidden leading-none transform -translate-y-full">
        <svg
          className="relative block w-full h-[120px]"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,60 C240,120 480,120 720,60 C960,0 1200,0 1440,60 L1440,120 L0,120 Z"
            fill="#FFFFFF"
          ></path>
        </svg>
      </div> */}

      <div className="container mx-auto px-10">
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-10 max-w-7xl mx-auto">
          {/* Brand & Newsletter */}
          <StaggerItem className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-8">
              <svg width="34" height="28" viewBox="0 0 34 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.98 12.01L14.47 5.97C14.71 4.97 13.9 4 12.87 4H8.4C6.52 4 5 5.52 5 7.4V12.01C5 12.56 5.44 13.01 6 13.01H11.98C12.54 13.01 12.98 12.56 12.98 12.01Z" fill="#1A1A1A" />
                <path d="M22.02 12.01L20.53 5.97C20.29 4.97 21.1 4 22.13 4H26.6C28.48 4 30 5.52 30 7.4V12.01C30 12.56 29.56 13.01 29 13.01H23.02C22.46 13.01 22.02 12.56 22.02 12.01Z" fill="#1A1A1A" />
                <circle cx="17.5" cy="19.5" r="3.5" fill="#1A1A1A" />
                <circle cx="11.5" cy="23.5" r="2.5" fill="#1A1A1A" />
                <circle cx="23.5" cy="23.5" r="2.5" fill="#1A1A1A" />
                <circle cx="14.5" cy="18.5" r="1.5" fill="#FFFFFF" />
                <circle cx="20.5" cy="18.5" r="1.5" fill="#FFFFFF" />
              </svg>
              <span className="text-3xl font-heading tracking-tight text-[#1A1A1A]">FurrCircle<span className="text-blue-400 text-[8px] relative -top-3">●</span></span>
            </Link>
            <p className="text-[#666666] leading-relaxed mb-8">
              The all-in-one pet care app for pet owners and veterinarians. Health records, vet bookings, reminders, and community — in one place.
            </p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Email Address"
                className="flex-1 bg-[#F9F8F6] rounded-xl px-5 py-3.5 text-[15px] outline-none focus:ring-1 focus:ring-[#987D6B] transition-all"
                required
              />
              <button type="submit" className="flex items-center justify-center w-14 h-[52px] rounded-xl bg-primary text-white hover:bg-primary/80 shrink-0 transition-colors">
                <ArrowRight className="h-5 w-5" />
              </button>
            </form>
          </StaggerItem>

          {/* Quick Links */}
          <StaggerItem>
            <h4 className="text-[22px] font-heading mb-6 text-[#1A1A1A]">Quick Links</h4>
            <ul className="space-y-4">
              {[
                { label: "Features", href: "#services" },
                { label: "Patients", href: "#patients" },
                { label: "Reviews", href: "#reviews" },
                { label: "Privacy Policy", href: "/privacy-policy" },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} onClick={(e) => handleFooterLinkClick(e, link.href)} className="text-[#666666] text-[15px] hover:text-[#987D6B] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </StaggerItem>

          {/* Contact Information */}
          <StaggerItem>
            <h4 className="text-[22px] font-heading mb-6 text-[#1A1A1A]">Contact Information</h4>
            <ul className="space-y-5 text-[#666666] text-[15px]">
              <li>123 PetCare Avenue, Cityville, USA</li>
              <li>1-800-FURR-CIRCLE</li>
              <li>info@furrcircle.com</li>
            </ul>
          </StaggerItem>

          {/* Social Media */}
          <StaggerItem>
            <h4 className="text-[22px] font-heading mb-6 text-[#1A1A1A]">Social Media</h4>
            <ul className="space-y-4">
              <li>
                <Link href="#" className="flex items-center gap-3 text-[#666666] text-[15px] hover:text-[#987D6B] transition-colors">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#F9F8F6]"><FaFacebook className="h-4 w-4" /></span> Facebook
                </Link>
              </li>
              <li>
                <Link
                  href="https://www.instagram.com/furrcircle"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-[#666666] text-[15px] hover:text-[#987D6B] transition-colors"
                >
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#F9F8F6]"><FaInstagram className="h-4 w-4" /></span> Instagram
                </Link>
              </li>
              <li>
                <Link href="#" className="flex items-center gap-3 text-[#666666] text-[15px] hover:text-[#987D6B] transition-colors">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#F9F8F6]"><FaTwitter className="h-4 w-4" /></span> Twitter
                </Link>
              </li>
              <li>
                <Link href="#" className="flex items-center gap-3 text-[#666666] text-[15px] hover:text-[#987D6B] transition-colors">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#F9F8F6]"><FaLinkedin className="h-4 w-4" /></span> LinkedIn
                </Link>
              </li>
            </ul>
          </StaggerItem>
        </StaggerContainer>

        <div className="pt-6 pb-6 border-t border-[#1A1A1A]/10 flex flex-col md:flex-row items-center justify-between gap-4 text-[13px] text-[#1A1A1A]">
          <p>© 2026 FurrCircle - The Product of Rhinon Tech. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
