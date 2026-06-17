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
    default: "FurrCircle — India's Social Network for Pet Lovers",
    template: "%s | FurrCircle",
  },
  description:
    "India's all-in-one app for pet parents — share posts & stories, match for playdates, adoption & breeding, track health records, book vets, and join local pet circles. Free on iOS & Android.",
  keywords: [
    "pet social network India",
    "pet community app",
    "pet matching app",
    "pet adoption app India",
    "lost pet finder",
    "pet care app India",
    "vet appointment booking",
    "pet health records",
    "dog cat social app",
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
    title: "FurrCircle — India's Social Network for Pet Lovers",
    description:
      "India's all-in-one app for pet parents — share posts & stories, match for playdates, adoption & breeding, track health records, book vets, and join local pet circles. Free on iOS & Android.",
    images: [
      {
        url: "/logo/furrcircle_light_logo.png",
        width: 1200,
        height: 630,
        alt: "FurrCircle — India's Social Network for Pet Lovers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FurrCircle — India's Social Network for Pet Lovers",
    description:
      "India's all-in-one app for pet parents — share posts & stories, match for playdates, adoption & breeding, track health records, book vets, and join local pet circles. Free on iOS & Android.",
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
