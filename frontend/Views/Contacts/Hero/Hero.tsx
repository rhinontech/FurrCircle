import { BouncingElement, PawPrint } from "@/Views/Home/Hero/Hero"
import Image from "next/image"


const Hero = () => {
    return (
        <div className="flex overflow-hidden relative mt-[95px] max-md:mt-[65px] bg-primary/70 items-center px-24 justify-between max-md:justify-center max-md:py-30 max-md:px-10 max-md:text-center">
            <h1 className="text-5xl md:text-8xl text-white font-heading ">Contact FurrCircle!</h1>
            <Image src="/contact/contactHero.webp" alt="aboutHero" width={500} height={500} className="z-10 max-md:hidden" />

            <BouncingElement
                axis="rotate"
                startVal={10}
                endVal={40}
                className="absolute top-[8%] max-md:top-[70%] max-md:right-[80%]  right-[35%] w-20 h-20 text-section-bg/50"
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
            <div className="absolute text-section-bg/50 bottom-3 w-60 h-auto max-md:w-32 -right-10 -rotate-60">
                <PawPrint className="w-full h-full" />
            </div>
        </div>
    )
}

export default Hero