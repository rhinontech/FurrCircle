import { Gallery } from "../About/Gallery/Gallery"
import { Contact } from "./New/Contact"
import { FAQ } from "./New/FAQ"
import { Hero } from "./New/Hero"
import { Patients } from "./New/Patients"
import { PetCare } from "./New/PetCare"
import { Services } from "./New/Services"
import { Testimonials } from "./New/Testimonials"
import { ValuesSignpost } from "./New/ValuesSignpost"


const Home = () => {
  return (
    <>
      <main className="flex-1 flex flex-col min-h-screen max-md:overflow-hidden bg-[#fffbf5]">
        <Hero />
        <ValuesSignpost />
        <Services />
        <Patients />
        <Testimonials />
        <Gallery />
        <PetCare />
        <FAQ />
        <Contact />
      </main>
    </>
  )
}

export default Home