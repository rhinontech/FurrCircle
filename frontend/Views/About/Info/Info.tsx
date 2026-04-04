import { FadeInUp } from '@/components/AnimationProvider'
import Image from 'next/image'
import React from 'react'
import { BouncingElement, PawPrint } from '@/Views/Home/Hero/Hero'

const Info = () => {
    return (
        <div className='flex  max-md:flex-col gap-20 relative px-28 pt-50 max-md:px-5 max-md:py-10'>

            {/* left side */}
            <BouncingElement
                axis="rotate"
                startVal={10}
                endVal={40}
                className="absolute z-10 top-[28%] max-md:top-[38%] max-md:left-[10%] left-[2%] w-48 h-48 text-primary/30"
            >
                <PawPrint className="w-full h-full" />
            </BouncingElement>
            <BouncingElement
                axis="rotate"
                startVal={-10}
                endVal={-40}
                className="absolute top-[15%] right-[7%] w-20 h-20 text-primary/70"
            >
                <PawPrint className="w-full h-full" />
            </BouncingElement>
            <BouncingElement
                axis="rotate"
                startVal={40}
                endVal={70}
                className="absolute z-10 bottom-10 max-md:left-[10%] left-[45%] w-18 h-18 text-primary/30"
            >
                <PawPrint className="w-full h-full" />
            </BouncingElement>

            <div className='max-xl:hidden w-1/2 h-[450px] flex items-center justify-center'>
                <FadeInUp>
                    <Image
                        src="/about-us/aboutInfo.png"
                        alt="Pet Care"
                        width={450}
                        height={450}
                        className="max-h-full w-auto object-contain"
                    />
                </FadeInUp>
            </div>

            <div className="hidden max-xl:block  text-center">
                <Image
                    src="/CTADog.png"
                    alt="Pet Care"
                    width={700}
                    height={700}
                    className="
      w-[700px] h-auto
      max-md:w-[600px]
      max-sm:w-[400px]
    "
                />
            </div>

            {/* right side */}
            <FadeInUp delay={0.5}>
                <div className='flex flex-col max-md:items-center '>

                    <h2 className="text-4xl md:text-6xl max-w-2xl max-md:text-center font-heading text-foreground mb-10 max-md:mb-5">
                        Dedicated to the
                        Well-Being of Your Beloved Pets</h2>


                    <p className='text-lg max-w-2xl text-muted-foreground max-md:text-center'>
                        PetPals is more than just a pet care center – we're a family of passionate animal lovers. With years of experience, our team is committed to providing the highest quality care and services to your furry, feathered, or scaled companions. Your pet's happiness and health are our top priorities, and we treat them with the same love and care as if they were our own.
                    </p>
                </div>
            </FadeInUp>


        </div>
    )
}

export default Info