import { FadeInUp } from "@/components/AnimationProvider";
import { BouncingElement, PawPrint } from "@/Views/Home/Hero/Hero";
import Image from "next/image";


export function AboutCTA() {

    return (
        <div className="py-32 max-md:py-10 relative">

            {/* image */}
            <div className='absolute max-xl:hidden left-20 top-26'>
                <FadeInUp>
                    <Image src="/about-us/aboutCTA.png" alt="Pet Care" width={450} height={450} />
                </FadeInUp>
            </div>

            <BouncingElement
                axis="rotate"
                startVal={10}
                endVal={40}
                className="absolute top-[20%] max-md:top-[24%] max-md:left-[5%] left-[5%] w-20 h-20 text-primary/70"
            >
                <PawPrint className="w-full h-full" />
            </BouncingElement>

            <BouncingElement
                axis="rotate"
                startVal={-10}
                endVal={-40}
                className="absolute top-[10%] max-md:top-[24%] max-md:left-[5%] left-[31%] w-20 h-20 text-primary/70"
            >
                <PawPrint className="w-full h-full" />
            </BouncingElement>


            <div className="max-w-7xl mx-auto flex justify-end">
                <FadeInUp delay={0.5}>
                    <div className='flex flex-col max-md:items-center max-w-3xl '>
                        <h2 className="text-4xl md:text-6xl  max-md:text-center font-heading text-foreground mb-10 max-md:mb-10">Ready to Experience <br /> PetPals Exceptional Care?</h2>
                        <p className="text-muted-foreground text-lg mb-10 ">Contact Us Today and Discover a World of Happiness and Health for Your Pet.</p>
                        <button className="h-14 px-10 w-fit rounded-full text-lg font-medium bg-primary hover:bg-[#8A7160] text-white transition-colors">
                            Claim Us Now
                        </button>
                    </div>
                </FadeInUp>
            </div>
        </div>
    )
}