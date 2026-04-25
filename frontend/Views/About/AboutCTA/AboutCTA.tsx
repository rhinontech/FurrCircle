import { FadeInUp } from "@/components/AnimationProvider";
import Button from "@/components/Common/Button";
import { BouncingElement, PawPrint } from "@/Views/Home/Hero/Hero";
import Image from "next/image";


export function AboutCTA() {

    return (
        <div className="py-32 max-md:py-10 max-md:pb-72 relative">

            {/* image */}
            <div className='absolute max-xl:hidden max-md:block max-md:w-[250px] max-md:h-fit max-md:top-[58%] max-md:left-1/2 max-md:-translate-x-1/2 left-20 top-26'>
                <FadeInUp>
                    <Image src="/about-us/aboutCTA1.webp" alt="Pet Care" width={450} height={450} className="w-full h-auto" />
                </FadeInUp>
            </div>

            <BouncingElement
                axis="rotate"
                startVal={10}
                endVal={40}
                className="absolute top-[20%] max-md:top-[54%] max-md:left-[5%] left-[5%] w-20 h-20 text-primary/70"
            >
                <PawPrint className="w-full h-full" />
            </BouncingElement>

            <BouncingElement
                axis="rotate"
                startVal={-10}
                endVal={-40}
                className="absolute top-[10%] max-md:top-[24%] max-md:left-[5%] max-md:hidden left-[31%] w-20 h-20 text-primary/70"
            >
                <PawPrint className="w-full h-full" />
            </BouncingElement>


            <div className="max-w-7xl  mx-auto flex justify-end max-xl:justify-center">
                <FadeInUp delay={0.5}>
                    <div className='flex flex-col max-md:items-center max-md:text-center max-w-3xl '>
                        <h2 className="text-4xl md:text-6xl  max-md:text-center font-heading text-foreground mb-10 max-md:mb-10">Ready to Experience the <br /> FurrCircle Ecosystem?</h2>
                        <p className="text-muted-foreground text-lg mb-10 ">Get Started Today and Discover a World of Happiness and Health for Your Pet with our Digital Health Passport.</p>
                        <Button text="Get Started Now" />
                    </div>
                </FadeInUp>
            </div>
        </div>
    )
}