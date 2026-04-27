import { Nunito } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Common/Navbar";
import { Footer } from "@/components/Common/Footer";
import { Metadata } from "next";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900", "1000"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://furrcircle.com"),
  title: {
    default: "FurrCircle — The Pet Care App for Every Pet Parent",
    template: "%s | FurrCircle",
  },
  description:
    "Track your pet's health records, book vet appointments, set reminders, and join India's community of pet parents — all in one app.",
  keywords: [
    "pet care app India",
    "vet appointment booking",
    "pet health records",
    "dog cat health app",
    "pet owner community India",
    "FurrCircle",
  ],
  authors: [{ name: "Rhinon Tech", url: "https://furrcircle.com" }],
  creator: "Rhinon Tech",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://furrcircle.com",
    siteName: "FurrCircle",
    title: "FurrCircle — The Pet Care App for Every Pet Parent",
    description:
      "Track your pet's health records, book vet appointments, set reminders, and join India's community of pet parents — all in one app.",
    images: [
      {
        url: "/logo/furrcircle_light_logo.png",
        width: 1200,
        height: 630,
        alt: "FurrCircle — The Pet Care App for Every Pet Parent",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FurrCircle — The Pet Care App for Every Pet Parent",
    description:
      "Track your pet's health records, book vet appointments, set reminders, and join India's community of pet parents — all in one app.",
    images: ["/logo/furrcircle_light_logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-IN"
      className={`${nunito.variable} antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col font-nunito bg-[#fffbf5] text-foreground"
      >
        <Navbar />
        {children}
        <Footer />

        <script src="/oneko.js"></script>
      </body>
    </html>
  );
}
