import React from 'react'

import Hero from './Hero/Hero'
import Info from './Info/Info'
import { Values } from './Values/Values'
import { Gallery } from './Gallery/Gallery'
import Stats from './Stats/Stats'
import { Teams } from './Teams/Teams'
import { AboutCTA } from './AboutCTA/AboutCTA'

const AboutUs = () => {
  return (
    <>
    <main className="flex-1 flex flex-col min-h-screen">
        <Hero />
        <Info />
        <Values />
        <Gallery />
        <Stats />
        <Teams />
        <AboutCTA />
    </main>
    </>
  )
}

export default AboutUs