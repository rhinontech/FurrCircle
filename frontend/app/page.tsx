import Home from "@/Views/Home/Home";
import JsonLd from "@/components/JsonLd";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "FurrCircle",
  url: "https://furrcircle.com",
  logo: "https://furrcircle.com/logo/furrcircle_light_logo.png",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    email: "info@rhinontech.com",
    telephone: "+918249291789",
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Hyderabad",
    addressRegion: "Telangana",
    addressCountry: "IN",
  },
  sameAs: ["https://www.instagram.com/furrcircle"],
};

const appSchema = {
  "@context": "https://schema.org",
  "@type": "MobileApplication",
  name: "FurrCircle",
  operatingSystem: "iOS, Android",
  applicationCategory: "HealthApplication",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
  },
  description:
    "Track your pet's health records, book vet appointments, set reminders, and join India's community of pet parents — all in one app.",
  url: "https://furrcircle.com",
  author: {
    "@type": "Organization",
    name: "Rhinon Tech",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is FurrCircle?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "FurrCircle is a free all-in-one pet care app for pet owners and veterinarians in India. It lets you store your pet's health records, book verified vet appointments, set vaccination and medication reminders, and connect with other pet parents in a community.",
      },
    },
    {
      "@type": "Question",
      name: "How do I book a vet appointment on FurrCircle?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Open the FurrCircle app, go to the 'Book a Vet' section, search for verified veterinarians near you, and select an available slot. You'll receive a confirmation and reminder notification.",
      },
    },
    {
      "@type": "Question",
      name: "Which pets does FurrCircle support?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "FurrCircle supports all types of pets including dogs, cats, rabbits, squirrels, turtles, parrots, and other exotic animals.",
      },
    },
    {
      "@type": "Question",
      name: "Is FurrCircle free to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, FurrCircle is free to download and use for both pet owners and veterinarians.",
      },
    },
    {
      "@type": "Question",
      name: "Where is FurrCircle available?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "FurrCircle is available on iOS and Android. It is developed in Hyderabad, India and serves pet owners and vets across India.",
      },
    },
  ],
};

export default function Page() {
  return (
    <>
      <JsonLd data={organizationSchema} />
      <JsonLd data={appSchema} />
      <JsonLd data={faqSchema} />
      <Home />
    </>
  );
}
