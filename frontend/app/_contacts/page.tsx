import type { Metadata } from "next";
import Contacts from "@/Views/Contacts/Contacts";

export const metadata: Metadata = {
  title: "Contact Us | FurrCircle — Hyderabad, India",
  description:
    "Have a question about FurrCircle? Reach our team in Hyderabad, Telangana. We're here to help pet owners and veterinarians get the most out of the app.",
  alternates: { canonical: "/_contacts" },
  openGraph: {
    url: "https://furrcircle.com/_contacts",
    title: "Contact Us | FurrCircle — Hyderabad, India",
    description:
      "Have a question about FurrCircle? Reach our team in Hyderabad, Telangana. We're here to help pet owners and veterinarians.",
    images: [
      {
        url: "/logo/furrcircle_light_logo.png",
        width: 1200,
        height: 630,
        alt: "Contact FurrCircle",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us | FurrCircle — Hyderabad, India",
    description:
      "Have a question about FurrCircle? Reach our team in Hyderabad, Telangana. We're here to help pet owners and veterinarians.",
    images: ["/logo/furrcircle_light_logo.png"],
  },
};

export default function Page() {
  return (
    <Contacts />
  );
}
