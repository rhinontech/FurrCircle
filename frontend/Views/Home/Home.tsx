import { Navbar } from '@/components/Common/Navbar'
import React from 'react'
import { Hero } from './Hero/Hero'
import { Footer } from '@/components/Common/Footer'
import { Services } from './Services/Services'
import { FeaturedMarquee } from './Features/FeaturedMarquee'
import { ValuesGrid } from './Values/ValuesGrid'
import { Testimonials } from './Testimonials/Testimonials'
import { Partners } from './Partners/Partners'
import CTA from './CTA/CTA'

const Home = () => {
  return (
     <>
      <main className="flex-1 flex flex-col min-h-screen">
        <Hero />
        <Services />
        <FeaturedMarquee />
        <ValuesGrid />
        <Testimonials />
        <Partners />
        <CTA />
      </main>
    </>
  )
}

export default Home