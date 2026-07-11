import React from "react";
import { Link } from "expo-router";
import { ArrowRight, Instagram } from "lucide-react";
import { StaggerContainer, StaggerItem } from "./AnimationProvider";

const handleFooterLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
  if (href.includes("#")) {
    e.preventDefault();
    const id = href.split("#")[1];
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }
};

export function Footer() {
  return (
    <footer className="bg-[url('/curveBg.svg')] bg-cover bg-top bg-no-repeat relative pt-32 pb-12">
      <div className="container mx-auto px-10">
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-10 max-w-7xl mx-auto">
          {/* Brand & Newsletter */}
          <StaggerItem className="lg:col-span-1">
            <Link href={"/web" as any} className="mb-8 inline-block">
              <img
                src="/logo/furrcircle_light_logo.webp"
                alt="FurrCircle"
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="text-[#666666] leading-relaxed mb-8">
              The all-in-one pet care app for pet owners and veterinarians. Health records, vet bookings, reminders, and community — in one place.
            </p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Email Address"
                className="flex-1 bg-[#F9F8F6] rounded-xl px-5 py-3.5 text-[15px] outline-none focus:ring-1 focus:ring-[#987D6B] transition-all"
                required
              />
              <button type="submit" className="flex items-center justify-center w-14 h-[52px] rounded-xl bg-blue-400 text-white hover:bg-blue-500 shrink-0 transition-colors">
                <ArrowRight className="h-5 w-5" />
              </button>
            </form>
          </StaggerItem>

          {/* Quick Links */}
          <StaggerItem>
            <h4 className="text-[22px] font-bold mb-6 text-[#1A1A1A]">Quick Links</h4>
            <ul className="space-y-4">
              {[
                { label: "Features", href: "/web#services" },
                { label: "Patients", href: "/web#patients" },
                { label: "Reviews", href: "/web#reviews" },
                { label: "About Us", href: "/web/about" },
                { label: "Privacy Policy", href: "/web/privacy-policy" },
              ].map((link) => (
                <li key={link.label}>
                  <a href={link.href} onClick={(e) => handleFooterLinkClick(e as any, link.href)} className="text-[#666666] text-[15px] hover:text-[#987D6B] transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </StaggerItem>

          {/* Contact Information */}
          <StaggerItem>
            <h4 className="text-[22px] font-bold mb-6 text-[#1A1A1A]">Contact Information</h4>
            <ul className="space-y-5 text-[#666666] text-[15px]">
              <li>Attapur, Hyderabad</li>
              <li>+91 824 929 1789</li>
              <li>info@rhinontech.com</li>
            </ul>
          </StaggerItem>

          {/* Social Media */}
          <StaggerItem>
            <h4 className="text-[22px] font-bold mb-6 text-[#1A1A1A]">Social Media</h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="https://www.instagram.com/furrcircle"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-[#666666] text-[15px] hover:text-[#987D6B] transition-colors"
                >
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#F9F8F6]">
                    <Instagram className="h-4 w-4" />
                  </span>{" "}
                  Instagram
                </a>
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
