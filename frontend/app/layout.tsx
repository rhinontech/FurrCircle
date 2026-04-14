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
      className={`${nunito.variable} antialiased`}
    >
      <body className="min-h-full flex flex-col font-nunito bg-[#fffbf5] text-foreground">
        <Navbar />
        {children}
        <Footer />

        <script src="/oneko.js"></script>
      </body>
    </html>
  );
}
