import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/sections/Hero";
import { ValuesSignpost } from "@/components/sections/ValuesSignpost";
import { Services } from "@/components/sections/Services";
import { Patients } from "@/components/sections/Patients";
import { Testimonials } from "@/components/sections/Testimonials";
import { PetCare } from "@/components/sections/PetCare";
import { FAQ } from "@/components/sections/FAQ";
import { Contact } from "@/components/sections/Contact";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F3F0E9]">
      <Navbar />
      <Hero />
      <ValuesSignpost />
      <Services />
      <Patients />
      <Testimonials />
      <PetCare />
      <FAQ />
      <Contact />
      <Footer />
    </main>
  );
}
