"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { FaInstagram } from "react-icons/fa";
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
            <Link href="/" className="mb-8 inline-block">
              <Image
                src="/logo/furrcircle_light_logo.png"
                alt="FurrCircle"
                width={185}
                height={60}
                priority
                className="h-10 w-auto object-contain"
              />
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
              <li>Attapur, hyderabad</li>
              <li>+91 824 929 1789</li>
              <li>info@rhinontech.com</li>
            </ul>
          </StaggerItem>

          {/* Social Media */}
          <StaggerItem>
            <h4 className="text-[22px] font-heading mb-6 text-[#1A1A1A]">Social Media</h4>
            <ul className="space-y-4">
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
