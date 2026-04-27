import type { Metadata } from "next";
import AboutUs from "@/Views/About/AboutUs";

export const metadata: Metadata = {
  title: "About FurrCircle | Our Mission & Team",
  description:
    "Learn about FurrCircle's mission to simplify pet care in India. Meet the Hyderabad-based team building India's all-in-one pet health app for dog, cat, and exotic pet owners.",
  alternates: { canonical: "/_about-us" },
  openGraph: {
    url: "https://furrcircle.com/_about-us",
    title: "About FurrCircle | Our Mission & Team",
    description:
      "Learn about FurrCircle's mission to simplify pet care in India. Meet the Hyderabad-based team building India's all-in-one pet health app.",
    images: [
      {
        url: "/logo/furrcircle_light_logo.png",
        width: 1200,
        height: 630,
        alt: "About FurrCircle",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About FurrCircle | Our Mission & Team",
    description:
      "Learn about FurrCircle's mission to simplify pet care in India. Meet the Hyderabad-based team building India's all-in-one pet health app.",
    images: ["/logo/furrcircle_light_logo.png"],
  },
};

export default function Page() {
  return (
    <AboutUs />
  );
}
