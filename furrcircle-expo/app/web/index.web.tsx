import React, { type FormEvent, useState } from "react";
import { Link } from "expo-router";
import { motion, Variants } from "framer-motion";
import {
  Heart,
  Users,
  MessagesSquare,
  Stethoscope,
  CalendarCheck,
  MapPin,
  BadgeDollarSign,
  ClipboardList,
  AlertTriangle,
  MessageCircle,
  Images,
  Star,
  ArrowRight,
  PawPrint
} from "lucide-react";
import { AnimatedHeading, FadeInUp, StaggerContainer, StaggerItem } from "./components/AnimationProvider";

// ==========================================
// DATA DEFINITIONS
// ==========================================

const frames = [
  {
    id: "left",
    color: "bg-[#9D8FE4]",
    width: "w-40 md:w-64",
    height: "h-72 md:h-[400px]",
    rotate: -12,
    delay: 0,
    margin: "mr-[-40px] md:mr-[-40px] mt-20",
    image: "/CTADog1.webp",
    imageClass: "top-[20%] h-[80%]"
  },
  {
    id: "center",
    color: "bg-[#87CEEB]",
    width: "w-56 md:w-92",
    height: "h-80 md:h-[550px]",
    rotate: 0,
    delay: 0.2,
    margin: "z-10",
    image: "/about-us/aboutInfo.webp",
    imageClass: "top-[20%] h-[80%]"
  },
  {
    id: "right",
    color: "bg-[#FABC3F]",
    width: "w-40 md:w-64",
    height: "h-72 md:h-[400px]",
    rotate: 12,
    delay: 0.4,
    margin: "ml-[-40px] md:ml-[-40px] mt-20",
    image: "/rabbit1.avif",
    imageClass: "h-[100%] scale-[1.3] top-[10%] origin-bottom"
  },
];

const signs = [
  { title: "PET MATCHING", icon: <Heart className="w-6 h-6" />, color: "bg-[#EA5222]", rotate: -3, delay: 0.1 },
  { title: "SOCIAL FEED", icon: <Users className="w-6 h-6" />, color: "bg-[#9D8FE4]", rotate: 2, delay: 0.2 },
  { title: "LOCAL CIRCLES", icon: <MessagesSquare className="w-6 h-6" />, color: "bg-[#E84393]", rotate: -2, delay: 0.3 },
  { title: "HEALTH PASSPORT", icon: <Stethoscope className="w-6 h-6" />, color: "bg-[#0CA2D0]", rotate: 3, delay: 0.4 },
  { title: "VET BOOKING", icon: <CalendarCheck className="w-6 h-6" />, color: "bg-[#53AF54]", rotate: -1, delay: 0.5 },
  { title: "LOCAL EVENTS", icon: <MapPin className="w-6 h-6" />, color: "bg-[#FABC3F]", rotate: 2, delay: 0.6 },
  { title: "ALWAYS FREE", icon: <BadgeDollarSign className="w-6 h-6" />, color: "bg-[#1A1A1A]", rotate: -3, delay: 0.7 },
];

const services = [
  { title: "PET MATCHING", description: "Swipe to find playdates, adoption partners, or breeding matches for your pet — like Tinder, but for pets.", icon: <Heart className="w-8 h-8" />, color: "bg-[#EA5222]" },
  { title: "SOCIAL FEED & STORIES", description: "Share photos and videos, follow pet parents near you, and post 24-hour stories with your community.", icon: <Users className="w-8 h-8" />, color: "bg-[#9D8FE4]" },
  { title: "CIRCLES & Q&A", description: "Join local pet circles — Dogs, Cats, Rescue, Health, Training — to ask questions, share advice, and meet nearby pet parents.", icon: <MessagesSquare className="w-8 h-8" />, color: "bg-[#E84393]" },
  { title: "HEALTH PASSPORT", description: "Store your pet's full medical history — vaccines, vitals, medications, allergies, and insurance — in one place.", icon: <ClipboardList className="w-8 h-8" />, color: "bg-[#53AF54]" },
  { title: "VET BOOKING", description: "Find verified veterinarians near you and book appointments in just a few taps.", icon: <CalendarCheck className="w-8 h-8" />, color: "bg-[#0CA2D0]" },
  { title: "LOCAL EVENTS", description: "Discover adoption drives, playdates, training sessions, and pet meetups happening near you.", icon: <MapPin className="w-8 h-8" />, color: "bg-[#FABC3F]" },
  { title: "LOST & FOUND", description: "Report lost pets, browse spotted animals, and reunite families with photo-based alerts in your city.", icon: <AlertTriangle className="w-8 h-8" />, color: "bg-[#1A1A1A]" },
  { title: "MEMORY VAULT", description: "Keep a beautiful, year-by-year photo vault of every pet — preserving a lifetime of moments and milestones.", icon: <Images className="w-8 h-8" />, color: "bg-[#6C5CE7]" },
  { title: "CHAT & MESSAGING", description: "Message other pet parents directly, share posts and profiles, and keep matched conversations all in one inbox.", icon: <MessageCircle className="w-8 h-8" />, color: "bg-[#00B894]" },
];

const patients = [
  { name: "DOGS", delay: 0.1, image: '/dog.avif' },
  { name: "CATS", delay: 0.2, image: '/cat.avif' },
  { name: "SQUIRRELS", delay: 0.3, image: '/squirrel.avif' },
  { name: "RABBITS", delay: 0.4, image: '/rabbit.avif' },
  { name: "TURTLES", delay: 0.5, image: '/turtle.avif' },
  { name: "PARROTS", delay: 0.6, image: '/parrot.avif' },
];

const testimonials = [
  { quote: "The pet matching feature is amazing! I found a playdate buddy for my dog within a day. It's literally Tinder for pets and I'm obsessed.", name: "ANJALI P.", image: '/testimonials/testimonial1.jpeg' },
  { quote: "I found my cat's new best friend through FurrCircle's matching feature, booked a vet in the same app, and even joined a local cat lovers circle. One app does everything.", name: "ISHRA F.", image: '/testimonials/testimonial2.jpeg' },
  { quote: "The stories and feed feel just like Instagram but only for pet parents. I've connected with so many people in my city and found two adoption events nearby. Highly recommend!", name: "RITIKA S.", image: '/testimonials/testimonial3.png' },
];

const galleryImages = [
  "/gallery/family1.jpeg",
  "/gallery/family2.jpeg",
  "/gallery/family3.jpeg",
  "/gallery/family4.jpeg",
  "/gallery/family5.jpeg",
  "/gallery/family6.jpeg",
];
const allGalleryImages = [...galleryImages, ...galleryImages];

const careTips = [
  { title: "REGULAR EXERCISE", description: "Keep your pet active with daily walks, play sessions, and enrichment activities suited to their breed and age.", color: "bg-[#53AF54]" },
  { title: "PROPER NUTRITION", description: "Feed your pet a balanced, age-appropriate diet and track their nutrition with FurrCircle's health log.", color: "bg-[#EA5222]" },
  { title: "ROUTINE VET VISITS", description: "Book regular check-ups through FurrCircle to stay on top of vaccinations and catch health issues early.", color: "bg-[#0CA2D0]" },
];

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function WebLandingIndex() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "success" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState("");

  const handleFormChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitState("idle");
    setSubmitMessage("");

    const apiUrl = `${process.env.EXPO_PUBLIC_API_URL || "http://localhost:5001"}/api/contact-leads`;

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          source: "home-contact",
          pagePath: window.location.pathname
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to submit your message.");
      }

      setFormData({ name: "", email: "", phone: "", message: "" });
      setSubmitState("success");
      setSubmitMessage("Thanks for reaching out! Our team will get back to you soon.");
    } catch (error) {
      setSubmitState("error");
      setSubmitMessage(error instanceof Error ? error.message : "Failed to submit your message.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col min-h-screen bg-[#fffbf5]">
      
      {/* -------------------------------------------
          HERO SECTION
          ------------------------------------------- */}
      <section className="relative pb-20 overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col items-center text-center max-w-5xl mx-auto gap-6 pt-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              {/* Tennis Ball */}
              <motion.div
                animate={{ y: [0, -15, 0], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -left-4 -top-0 w-10 h-10 md:w-14 md:h-14 z-10 hidden md:block"
              >
                <img src="/decorations/tennis-ball.svg" alt="Tennis Ball" className="drop-shadow-xl w-full h-full" />
              </motion.div>

              {/* Prize Badge */}
              <motion.div
                animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-[24%] top-[45%] w-12 h-16 md:w-10 md:h-14 z-20 hidden md:block"
              >
                <img src="/decorations/prize-badge.svg" alt="Prize Badge" className="drop-shadow-xl w-full h-full" />
              </motion.div>

              {/* Pet Bowl */}
              <motion.div
                animate={{ x: [0, 5, 0], rotate: [0, -3, 3, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-16 md:-right-8 bottom-24 w-24 h-12 md:w-18 md:h-12 z-20 hidden md:block"
              >
                <img src="/decorations/pet-bowl.svg" alt="Pet Bowl" className="drop-shadow-xl w-full h-full" />
              </motion.div>

              <AnimatedHeading
                text="India's Social Network \n For Pet Lovers"
                tag="h1"
                stagger={0.1}
                className="text-4xl sm:text-6xl md:text-8xl font-black leading-[1.1] text-[#1A1A1A] uppercase tracking-tighter pt-5 relative z-10"
              />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-lg md:text-2xl text-[#1A1A1A] max-w-3xl font-medium"
            >
              Share moments, find playdates, track health records, and connect with pet parents near you — all in one place.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex flex-wrap items-center justify-center gap-4 mt-2"
            >
              <a
                href="https://apps.apple.com/in/app/furrcircle/id6762140389"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform hover:scale-105 active:scale-95"
              >
                <img src="/appleButton.svg" alt="Download on the App Store" className="h-14 w-auto" />
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=com.furrcircle.app"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform hover:scale-105 active:scale-95"
              >
                <img src="/googleButton.svg" alt="Get it on Google Play" className="h-14 w-auto" />
              </a>
            </motion.div>
          </div>

          {/* Hero Visual Frames */}
          <div className="flex relative flex-row items-center justify-center gap-4 md:gap-8 mt-12 w-full">
            {frames.map((frame) => (
              <motion.div
                key={frame.id}
                initial={{ scale: 0.7, opacity: 0, rotate: frame.rotate }}
                whileInView={{ scale: 1, opacity: 1, rotate: frame.rotate }}
                viewport={{ once: true }}
                transition={{
                  delay: frame.delay,
                  duration: 0.8,
                  type: "spring",
                  stiffness: 100,
                  damping: 20
                }}
                className={`
                  ${frame.width} ${frame.height} 
                  ${frame.color} ${frame.margin}
                  rounded-[100px] md:rounded-[200px] 
                  overflow-hidden shadow-2xl relative
                `}
              >
                <img
                  src={frame.image}
                  alt={`${frame.id} pet`}
                  className={`absolute bottom-0 left-0 w-full object-contain object-bottom ${frame.imageClass}`}
                />
              </motion.div>
            ))}

            <div className="absolute max-md:hidden top-10 left-20 w-44 h-44 pointer-events-none opacity-100">
              <img src='/pawprint1.png' alt="Paw Print" className="object-contain w-full h-full" />
            </div>

            <div className="absolute max-md:hidden bottom-0 right-30 w-44 h-44 pointer-events-none opacity-100">
              <img src='/pawprint2.png' alt="Paw Print" className="object-contain w-full h-full" />
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------
          VALUES SIGNPOST SECTION
          ------------------------------------------- */}
      <section className="relative py-20 overflow-hidden min-h-[900px] flex flex-col items-center">
        <div className="container mx-auto px-6 relative z-10 flex flex-col items-center">
          <div className="absolute max-md:hidden top-50 left-50 w-44 h-44 pointer-events-none opacity-100">
            <img src='/pawprint1.png' alt="Paw Print" className="object-contain w-full h-full" />
          </div>
          <div className="absolute max-md:hidden top-50 right-40 w-34 h-34 pointer-events-none opacity-100">
            <img src='/pawprint1.png' alt="Paw Print" className="object-contain w-full h-full" />
          </div>
          <div className="absolute max-md:hidden bottom-50 right-40 w-34 h-34 pointer-events-none opacity-100">
            <img src='/pawprint2.png' alt="Paw Print" className="object-contain w-full h-full" />
          </div>
          <div className="absolute max-md:hidden bottom-30 left-40 w-44 h-44 pointer-events-none opacity-100">
            <img src='/pawprint2.png' alt="Paw Print" className="object-contain w-full h-full" />
          </div>

          <div className="text-center mb-16">
            <AnimatedHeading
              text="WHY FURRCIRCLE?"
              className="text-5xl md:text-7xl font-extrabold mb-6 text-[#1A1A1A] uppercase"
            />
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl md:text-3xl text-gray-600 font-normal"
            >
              More than health tracking — a full social world for pet lovers.
            </motion.p>
          </div>

          {/* The Signpost */}
          <div className="relative flex flex-col items-center w-full max-w-lg mt-12 pb-24">
            {/* Central Pole */}
            <div className="absolute top-0 bottom-0 w-8 bg-[#1A1A1A] rounded-full left-1/2 -translate-x-1/2" />

            {/* Top Cap */}
            <div className="absolute -top-4 w-16 h-8 bg-[#1A1A1A] rounded-full z-20 left-1/2 -translate-x-1/2" />

            {/* Signs Grid */}
            <div className="relative z-10 flex flex-col items-center gap-6 pt-12">
              {signs.map((sign, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8, x: i % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, scale: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: sign.delay, type: "spring", stiffness: 100 }}
                  className={`
                    flex items-center gap-4 px-10 py-5 rounded-2xl shadow-xl border-b-4 border-black/20
                    ${sign.color} text-white font-extrabold text-2xl md:text-3xl whitespace-nowrap
                  `}
                  style={{ transform: `rotate(${sign.rotate}deg)` }}
                >
                  <div className="flex-shrink-0">{sign.icon}</div>
                  <span>{sign.title}</span>
                </motion.div>
              ))}
            </div>

            {/* Base */}
            <div className="absolute -bottom-4 w-64 h-10 bg-[#1A1A1A] rounded-[100%] left-1/2 -translate-x-1/2" />
          </div>
        </div>
      </section>

      {/* -------------------------------------------
          SERVICES SECTION
          ------------------------------------------- */}
      <section id="services" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <AnimatedHeading
              text="WHAT YOU CAN DO"
              className="text-5xl md:text-7xl font-black mb-6 text-[#1A1A1A] uppercase tracking-tight"
            />
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl md:text-2xl text-[#1A1A1A]/80 font-medium"
            >
              A complete pet social platform — not just health, but community, matching, and more.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-16 gap-y-24 max-w-7xl mx-auto">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center text-center animate-hover"
              >
                <div className="relative group mb-10">
                  <div className={`
                    w-32 h-32 rounded-full flex items-center justify-center text-white
                    ${service.color} shadow-2xl transition-transform duration-500 hover:scale-105
                    relative
                  `}>
                    <div className="absolute inset-3 border-2 border-dashed border-white/40 rounded-full" />
                    <div className="w-20 h-20 rounded-full bg-white/25 flex items-center justify-center relative z-10 shadow-inner">
                      <div className="transition-transform duration-500 hover:scale-110">
                        {service.icon}
                      </div>
                    </div>
                  </div>
                </div>

                <h3 className="text-2xl font-black mb-1 text-[#1A1A1A] tracking-tight uppercase">
                  {service.title}
                </h3>
                <p className="text-lg font-medium text-[#1A1A1A]/90 leading-relaxed">
                  {service.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------
          PATIENTS SECTION
          ------------------------------------------- */}
      <section id="patients" className="relative py-20 overflow-hidden">
        <div className="absolute max-md:hidden top-40 left-40 w-24 h-24 pointer-events-none opacity-100">
          <img src='/pawprint1.png' alt="Paw Print" className="object-contain w-full h-full" />
        </div>
        <div className="absolute max-md:hidden top-40 right-40 w-34 h-34 pointer-events-none opacity-100">
          <img src='/pawprint1.png' alt="Paw Print" className="object-contain w-full h-full" />
        </div>
        <div className="absolute max-md:hidden bottom-50 left-40 w-34 h-34 pointer-events-none opacity-100">
          <img src='/pawprint2.png' alt="Paw Print" className="object-contain w-full h-full" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-20 px-4">
            <AnimatedHeading
              text="MADE FOR ALL PETS"
              className="text-5xl md:text-7xl font-black mb-6 text-[#1A1A1A] uppercase tracking-tight"
            />
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl md:text-2xl text-[#1A1A1A]/80 font-medium"
            >
              Whether you have a dog, cat, rabbit, or something more exotic — FurrCircle has you covered.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16 max-w-6xl mx-auto">
            {patients.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: p.delay }}
                className="flex flex-col items-center group"
              >
                <div className="w-56 h-56 md:w-64 md:h-64 rounded-full border flex items-center justify-center p-4 mb-6 transition-transform hover:scale-105 shadow-sm overflow-hidden relative">
                  <div className="relative w-[90%] h-[90%]">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="absolute inset-0 w-full h-full object-contain mt-10"
                    />
                  </div>
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-[#1A1A1A] uppercase tracking-tighter">
                  {p.name}
                </h3>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-20 text-2xl md:text-3xl font-black text-[#1A1A1A] uppercase tracking-widest opacity-20"
          >
            ...and many more
          </motion.p>
        </div>
      </section>

      {/* -------------------------------------------
          TESTIMONIALS SECTION
          ------------------------------------------- */}
      <section id="reviews" className="relative py-24 overflow-hidden">
        <div className="absolute max-md:hidden top-30 left-40 w-34 h-34 pointer-events-none opacity-100">
          <img src='/pawprint1.png' alt="Paw Print" className="object-contain w-full h-full" />
        </div>
        <div className="absolute max-md:hidden top-30 right-40 w-34 h-34 pointer-events-none opacity-100">
          <img src='/pawprint1.png' alt="Paw Print" className="object-contain w-full h-full" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-20 px-4">
            <AnimatedHeading
              text="LOVED BY \n PET PARENTS"
              className="text-5xl md:text-6xl font-black mb-6 text-[#1A1A1A] uppercase tracking-tight leading-[1.1]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-start text-left"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-50 shrink-0">
                    <img
                      src={t.image}
                      alt={t.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-black text-[#1A1A1A] text-xl tracking-tight uppercase">
                      {t.name}
                    </h4>
                    <div className="flex gap-1 mt-1">
                      {[...Array(5)].map((_, starIndex) => (
                        <Star key={starIndex} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-[#1A1A1A]/70 text-lg leading-relaxed pt-2 border-t border-gray-50">
                  {t.quote}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------
          GALLERY SECTION
          ------------------------------------------- */}
      <section className="py-32 overflow-hidden">
        <div className="container relative mx-auto px-6 max-w-7xl mb-16">
          <div className="absolute max-md:hidden top-15 right-40 w-34 h-34 pointer-events-none opacity-100">
            <img src='/pawprint1.png' alt="Paw Print" className="object-contain w-full h-full" />
          </div>

          <div className="flex flex-col items-center text-center">
            <AnimatedHeading
              text="Our FurrCircle Family in Pictures"
              className="text-5xl md:text-7xl font-black mb-6 text-[#1A1A1A] uppercase tracking-tight leading-[1.1]"
            />
            <FadeInUp delay={0.1}>
              <p className="text-gray-500 text-lg md:text-xl max-w-3xl">
                A Glimpse into the Joyful Moments We Share with Your Beloved Pets
              </p>
            </FadeInUp>
          </div>
        </div>

        <div className="relative flex overflow-hidden">
          <motion.div
            className="flex gap-4 px-5"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 40, ease: "linear", repeat: Infinity }}
            style={{ width: "fit-content" }}
          >
            {allGalleryImages.map((src, index) => (
              <div
                key={index}
                className="relative w-50 h-70 md:w-75 md:h-87.5 rounded-[1rem] overflow-hidden shrink-0 shadow-lg"
              >
                <motion.div
                  className="relative w-full h-full cursor-pointer"
                  whileHover={{ scale: 1.08 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <img
                    src={src}
                    alt={`Pet Family picture ${index + 1}`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </motion.div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* -------------------------------------------
          PET CARE SECTION
          ------------------------------------------- */}
      <section className="relative pb-20 overflow-hidden">
        <div className="absolute max-md:hidden top-80 right-20 w-34 h-34 pointer-events-none opacity-100">
          <img src='/pawprint1.png' alt="Paw Print" className="object-contain w-full h-full" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="w-full lg:w-1/2 flex justify-center"
            >
              <div className="relative w-full max-w-xl aspect-[3/4.5] rounded-full overflow-hidden bg-[#87CEEB] shadow-2xl">
                <img
                  src="/contact/contactHero.webp"
                  alt="Happy Dog and Cat"
                  className="absolute bottom-0 left-0 w-full h-[70%] object-cover"
                />
              </div>
            </motion.div>

            <div className="w-full lg:w-1/2">
              <AnimatedHeading
                text="HOW TO TAKE CARE \n OF YOUR PET"
                className="text-4xl md:text-6xl font-black mb-12 text-[#1A1A1A] leading-tight uppercase"
              />

              <div className="space-y-10">
                {careTips.map((tip, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-6"
                  >
                    <div className={`mt-2 w-4 h-4 rounded-full shrink-0 ${tip.color}`} />
                    <div>
                      <h3 className="text-2xl font-black mb-3 text-[#1A1A1A] uppercase tracking-tight">
                        {tip.title}
                      </h3>
                      <p className="text-lg text-[#1A1A1A]/70 leading-relaxed max-w-md">
                        {tip.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------
          CONTACT SECTION
          ------------------------------------------- */}
      <section className="relative py-24 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="absolute left-[5%] top-[10%] w-48 h-48 md:w-64 md:h-64 rounded-full bg-[#53AF54] overflow-hidden flex items-center justify-center shadow-2xl z-20 max-md:hidden"
        >
          <img
            src="/parrot.avif"
            alt="Parrot"
            className="w-full h-full object-contain p-8 mt-5 animate-bounce"
            style={{ animationDuration: '6s' }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 100 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="absolute max-md:hidden right-[5%] bottom-[10%] w-40 h-40 md:w-56 md:h-56 rounded-full bg-[#9D8FE4] overflow-hidden flex items-center justify-center shadow-2xl z-20"
        >
          <img
            src="/rabbit.avif"
            alt="Rabbit"
            className="w-full h-[90%] object-contain mt-10"
          />
        </motion.div>

        <div className="absolute max-md:hidden top-96 left-40 w-34 h-34 rotate-90 pointer-events-none opacity-100">
          <img src='/pawprint1.png' alt="Paw Print" className="object-contain w-full h-full" />
        </div>
        <div className="absolute max-md:hidden top-96 right-40 w-34 h-34 pointer-events-none opacity-100">
          <img src='/pawprint1.png' alt="Paw Print" className="object-contain w-full h-full" />
        </div>

        <div className="max-w-xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16 px-4">
            <AnimatedHeading
              text="STILL HAVE QUESTIONS? \n GET IN TOUCH."
              className="text-5xl md:text-6xl font-black mb-6 text-[#1A1A1A] uppercase tracking-tight leading-[1.1]"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <form className="space-y-6" onSubmit={handleFormSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#1A1A1A] px-1 uppercase tracking-wider">Name</label>
                  <input
                    type="text"
                    placeholder="Jane Smith"
                    value={formData.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                    className="w-full px-6 py-4 rounded-xl border-none bg-gray-100 focus:ring-2 focus:ring-[#87CEEB] text-[#1A1A1A] placeholder:text-gray-400 outline-none transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#1A1A1A] px-1 uppercase tracking-wider">Email</label>
                  <input
                    type="email"
                    placeholder="jane@example.com"
                    value={formData.email}
                    onChange={(e) => handleFormChange("email", e.target.value)}
                    className="w-full px-6 py-4 rounded-xl border-none bg-gray-100 focus:ring-2 focus:ring-[#87CEEB] text-[#1A1A1A] placeholder:text-gray-400 outline-none transition-all"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1A1A1A] px-1 uppercase tracking-wider">Phone</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => handleFormChange("phone", e.target.value)}
                  className="w-full px-6 py-4 rounded-xl border-none bg-gray-100 focus:ring-2 focus:ring-[#87CEEB] text-[#1A1A1A] placeholder:text-gray-400 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1A1A1A] px-1 uppercase tracking-wider">Message</label>
                <textarea
                  rows={5}
                  placeholder="Your message..."
                  value={formData.message}
                  onChange={(e) => handleFormChange("message", e.target.value)}
                  className="w-full px-6 py-4 rounded-xl border-none bg-gray-100 focus:ring-2 focus:ring-[#87CEEB] text-[#1A1A1A] placeholder:text-gray-400 outline-none transition-all resize-none"
                  required
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isSubmitting}
                className="w-full py-5 rounded-full bg-[#87CEEB] text-[#1A1A1A] font-black text-xl uppercase tracking-widest shadow-lg hover:shadow-xl transition-all mt-4"
              >
                {isSubmitting ? "Sending..." : "Submit"}
              </motion.button>
              {submitMessage && (
                <p className={`text-sm font-medium ${submitState === "success" ? "text-emerald-600" : "text-rose-600"}`}>
                  {submitMessage}
                </p>
              )}
            </form>
          </motion.div>
        </div>
      </section>

    </main>
  );
}
