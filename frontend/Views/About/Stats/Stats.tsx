'use client'
import Image from 'next/image'

import React from 'react'
import { motion } from 'framer-motion'
import { FadeInUp } from '@/components/AnimationProvider';


export const stats = [
    {
        value: "10K+",
        title: "Happy Pets",
        content:
            "PetPals has brought joy and well-being to over 10,000 pets, enriching their lives with love and care.",
    },
    {
        value: "99%",
        title: "Customer Satisfaction",
        content:
            "We take pride in our 99% customer satisfaction rate, a testament to our commitment to excellence.",
    },
    {
        value: "25",
        title: "Years of Caring",
        content:
            "With 25 years of experience, we've been dedicated to ensuring your pets lead healthy and happy lives.",
    },
    {
        value: "50+",
        title: "Expert Team Members",
        content:
            "Our team comprises 50+ passionate experts in pet care, including veterinarians, trainers, and groomers.",
    },
    {
        value: "1st",
        title: "Choice for Pet Parents",
        content:
            "Many consider PetPals their first choice for pet care, making us a trusted name in the community.",
    },
];

const Stats = () => {


    return (
        <div className='py-32 relative max-md:py-10 bg-section-bg'>
            <div className='max-w-7xl mx-auto flex justify-between'>

                {/* Left side */}
                <div className='flex items-center'>
                    <Image src={'/about-us/aboutStats.png'} alt='aboutStats' width={400} height={400} />
                </div>

                {/* Right side */}

                <div className='flex flex-col gap-10'>
                    {stats.map((stat) => (
                        <FadeInUp key={stat.value}>
                            <div key={stat.value} className='flex max-w-lg items-center gap-5'>

                                <h2 className='text-5xl font-heading w-[200px]'>{stat.value}</h2>
                                <div>
                                    <h3 className='text-lg mb-3 font-heading'>{stat.title}</h3>
                                    <p className='text-sm font-body text-muted-foreground font-normal'>{stat.content}</p>
                                </div>

                            </div>
                        </FadeInUp>
                    ))}

                </div>

            </div>
        </div>
    )
}

export default Stats