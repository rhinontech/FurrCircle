import type { Metadata } from "next";
import Services from "@/Views/Services/Services";

export const metadata: Metadata = {
  title: "Features & Services | FurrCircle Pet Care App",
  description:
    "Digital pet health records, online vet appointment booking, smart pet reminders, and India's growing pet owner community. Everything your pet needs, in one free app.",
  alternates: { canonical: "/_services" },
  openGraph: {
    url: "https://furrcircle.com/_services",
    title: "Features & Services | FurrCircle Pet Care App",
    description:
      "Digital pet health records, online vet appointment booking, smart pet reminders, and India's growing pet owner community.",
    images: [
      {
        url: "/logo/furrcircle_light_logo.png",
        width: 1200,
        height: 630,
        alt: "FurrCircle Features & Services",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Features & Services | FurrCircle Pet Care App",
    description:
      "Digital pet health records, online vet appointment booking, smart pet reminders, and India's growing pet owner community.",
    images: ["/logo/furrcircle_light_logo.png"],
  },
};

export default function Page() {
  return (
    <Services />
  );
}