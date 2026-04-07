import { BouncingElement, PawPrint } from "@/Views/Home/Hero/Hero"
import Image from "next/image"


const AboutUs = () => {
  return (
    <div className="flex flex-row-reverse overflow-hidden relative mt-[95px] max-md:mt-[65px] bg-primary/70 items-center px-24 justify-between max-md:justify-center max-md:py-30 max-md:px-5">
      <h1 className="text-5xl text-end max-md:text-center md:text-8xl text-white font-heading ">Our Pet Care <br />Solutions</h1>
      <Image src="/services/servicesHero.png" alt="aboutHero" width={500} height={500} className="z-10 max-md:hidden" />

      <BouncingElement
        axis="rotate"
        startVal={10}
        endVal={40}
        className="absolute top-[12%] left-[28%] w-14 h-14 max-md:left-[73%] text-section-bg/50"
      >
        <PawPrint className="w-full h-full" />
      </BouncingElement>
      <BouncingElement
        axis="rotate"
        startVal={-10}
        endVal={-40}
        className="absolute top-[35%] left-[3%] w-20 h-20 max-md:top-[3%] text-section-bg/50"
      >
        <PawPrint className="w-full h-full" />
      </BouncingElement>
      <div className="absolute text-section-bg/50 bottom-3 w-60 h-60 max-md:w-36 max-md:h-36 max-md:left-[70%] left-[30%] -rotate-60">
        <PawPrint className="w-full h-full" />
      </div>
    </div>
  )
}

export default AboutUs