import React from 'react'
import Hero from './Hero/Hero'
import ServiceSection from './Services/ServiceSection'
import ServiceCTA from './ServiceCTA/ServiceCTA'

const Services = () => {
  return (
    <>
    <main className="flex-1 flex flex-col min-h-screen">
        <Hero />
        <ServiceSection />
        <ServiceCTA />
    </main>
    </>
  )
}

export default Services