import { FadeInUp } from "@/components/AnimationProvider";
import Button from "@/components/Common/Button";
import { BouncingElement, PawPrint } from "@/Views/Home/Hero/Hero";
import Image from "next/image";


export default function ServiceCTA() {

    return (
        <div className="py-32 max-md:py-10 relative">

            {/* Exact Framer Wavy Divider */}
            {/* <div className="absolute top-10 left-0 w-full overflow-hidden leading-none transform -translate-y-full"> */}
            {/* <svg
                    className="relative block w-full h-[140px]"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 1440 140"
                    preserveAspectRatio="none"
                >
                    <defs>
                        <filter id="waveShadow" x="0" y="0" width="100%" height="200%">
                            <feDropShadow dx="0" dy="-4" stdDeviation="6" floodColor="#000" floodOpacity="0.2" />
                        </filter>
                    </defs>

                    <path
                        d="M0,80 
       C180,140 360,0 540,60 
       C720,120 900,20 1080,60 
       C1260,100 1350,40 1440,80 
       L1440,140 
       L0,140 
       Z"
                        fill="#F9F8F6"
                        filter="url(#waveShadow)"
                    />
                </svg> */}

            {/* <svg
                    className="relative block w-full h-[140px]"
                    viewBox="0 0 1440 140"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="none"
                >
                    <defs>
                        <filter id="waveShadow" x="0" y="0" width="100%" height="200%">
                            <feDropShadow dx="0" dy="-4" stdDeviation="6" floodColor="#000" floodOpacity="0.2" />
                        </filter>
                    </defs>
                    <path
                        d="
      M0,90
      C180,40 360,40 540,90
      C720,140 900,140 1080,90
      C1260,40 1350,40 1440,90
      L1440,140
      L0,140
      Z
    "
                        fill="#F9F8F6"
                        filter="url(#waveShadow)"
                    />
                </svg>
            </div> */}

            <BouncingElement
                axis="rotate"
                startVal={10}
                endVal={40}
                className="absolute top-[20%] max-md:top-[24%] max-md:left-[5%] left-[5%] w-20 h-20 text-primary/20"
            >
                <PawPrint className="w-full h-full" />
            </BouncingElement>

            <BouncingElement
                axis="rotate"
                startVal={-10}
                endVal={-40}
                className="absolute top-[10%] max-md:top-[24%] max-md:right-[5%] right-[10%] w-20 h-20 text-primary/20"
            >
                <PawPrint className="w-full h-full" />
            </BouncingElement>
            <BouncingElement
                axis="rotate"
                startVal={-40}
                endVal={-70}
                className="absolute top-[60%] max-md:hidden max-md:top-[24%] max-md:right-[5%] right-[30%] w-20 h-20 text-primary/20"
            >
                <PawPrint className="w-full h-full" />
            </BouncingElement>


            <div className="max-w-7xl mx-auto flex justify-center">
                <FadeInUp delay={0.5}>
                    <div className='flex flex-col text-center items-center '>
                        <h2 className="text-4xl md:text-6xl  max-md:text-center font-heading text-foreground mb-10 max-md:mb-10">Ready to Give Your Pet the Best Care?</h2>
                        <p className="text-muted-foreground text-lg mb-10 max-w-xl ">Explore Our Services and Treat Your Furry Companion to a World of Love, Health, and Happiness.</p>
                        <Button text="Claim Us Now" />
                    </div>
                </FadeInUp>
            </div>
        </div>
    )
}