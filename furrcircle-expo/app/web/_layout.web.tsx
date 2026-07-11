import React from "react";
import { Slot } from "expo-router";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";

export default function WebLayout() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#fffbf5] text-[#1A1A1A] overflow-x-hidden selection:bg-[#987D6B]/30">
      <Navbar />
      <div className="flex-1 flex flex-col pt-[70px] md:pt-[90px]">
        <Slot />
      </div>
      <Footer />
    </div>
  );
}
