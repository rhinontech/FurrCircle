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
  applicationCategory: "SocialNetworkingApplication",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
  },
  description:
    "FurrCircle is India's social network for pet lovers. Share posts and stories, match your pet for playdates, adoption or breeding, track health records, book vets, report lost pets, and join local pet circles — all in one free app.",
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
        text: "FurrCircle is India's free all-in-one social network for pet lovers. You can share posts and stories, match your pet for playdates, adoption or breeding, store health records, book verified vets, report lost pets, and join local pet circles to connect with other pet parents near you.",
      },
    },
    {
      "@type": "Question",
      name: "What are Circles on FurrCircle?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Circles are local, interest-based communities on FurrCircle — like Dogs, Cats, Rescue, Health, and Training. You can join circles near you, ask and answer questions, share advice, and meet pet parents in your city.",
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
