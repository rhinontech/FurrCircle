import { FadeInUp } from '@/components/AnimationProvider'
import Image from 'next/image'
import React from 'react'
import { BouncingElement, PawPrint } from '../Hero/Hero'
import Button from '@/components/Common/Button'

const CTA = () => {
    return (
        <div className='flex max-md:flex-col gap-20 relative px-28 py-40 max-md:px-5 max-md:py-10'>

            {/* left side */}
            <FadeInUp delay={0.5}>
            <div className='flex flex-col max-md:items-center '>
                
                    <h2 className="text-4xl md:text-6xl max-w-2xl max-md:text-center font-heading text-foreground mb-20 max-md:mb-10">Ready to Give Your Pet the Best Care? Contact Us Today!</h2>
                

                <Button text=' Claim Us Now' />
            </div>
            </FadeInUp>

            {/* right side */}
            <BouncingElement
                axis="rotate"
                startVal={10}
                endVal={40}
                className="absolute z-10 top-[2%] max-md:top-[38%] max-md:left-[10%] left-[55%] w-20 h-20 text-primary/70"
            >
                <PawPrint className="w-full h-full" />
            </BouncingElement>
            <BouncingElement
                axis="rotate"
                startVal={-10}
                endVal={-40}
                className="absolute top-[40%] right-[7%] w-20 h-20 text-primary/70"
            >
                <PawPrint className="w-full h-full" />
            </BouncingElement>

            <div className='absolute max-xl:hidden right-30 top-16'>
                <FadeInUp>
                    <Image src="/CTADog.png" alt="Pet Care" width={700} height={700} />
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


        </div>
    )
}

export default CTA