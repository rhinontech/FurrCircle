import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, DM_Serif_Display, Lexend } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Common/Navbar";
import { Footer } from "@/components/Common/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const lexend = Lexend({
  variable: "--font-lexend",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FurrCircle | The Digital Health Passport for Your Pets",
  description: "Centralize medical records, track vaccinations, and join a global community of pet parents with FurrCircle.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${lexend.variable} antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        <Navbar />
        {children}
        <Footer />

        <script src="/oneko.js"></script>
      </body>
    </html>
  );
}
