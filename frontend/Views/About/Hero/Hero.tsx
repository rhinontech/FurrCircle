import { BouncingElement, PawPrint } from "@/Views/Home/Hero/Hero"
import Image from "next/image"


const AboutUs = () => {
    return (
        <div className="flex overflow-hidden relative mt-[95px] bg-primary/70 items-center max-md:py-20 px-24 max-md:px-10 justify-between">
            <h1 className="text-6xl md:text-8xl text-white font-heading max-md:text-center ">Welcome, <br />Buddies to FurrCircle!</h1>
            <Image src="/about-us/aboutHero.webp" alt="aboutHero" width={500} height={500} className="z-10 max-md:hidden" />

            <BouncingElement
            axis="rotate"
            startVal={10}
            endVal={40}
            className="absolute top-[8%] right-[35%] w-20 h-20 max-md:hidden text-section-bg/50"
          >
            <PawPrint className="w-full h-full" />
          </BouncingElement>
          <BouncingElement
            axis="rotate"
            startVal={-10}
            endVal={-40}
            className="absolute top-[22%] right-[5%] w-10 h-10 text-section-bg/50"
          >
           <PawPrint className="w-full h-full" /> 
          </BouncingElement>
          <div className="absolute text-section-bg/50 bottom-3 w-60 h-60 max-md:w-36 max-md:h-36 -right-10 -rotate-60">
                <PawPrint className="w-full h-full" />
          </div>
        </div>
    )
}

export default AboutUs