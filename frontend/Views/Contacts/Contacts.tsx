import React from 'react'
import Hero from './Hero/Hero'
import Info from './Info/Info'
import { AboutCTA } from '../About/AboutCTA/AboutCTA'


const Contacts = () => {
  return (
    <>
    <main className="flex-1 flex flex-col min-h-screen">
        <Hero />
        <Info />
        <AboutCTA />
    
    </main>
    </>
  )
}

export default Contacts