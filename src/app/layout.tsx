import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthWrapper from "@/components/auth/AuthWrapper";
import Footer from "@/components/layout/Footer";
import AnalyticsProvider from "@/components/analytics/AnalyticsProvider";
import Navbar from "@/components/layout/Navbar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import FirebaseDebug from "@/components/FirebaseDebug";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Placemarks - Organize Your Places",
  description: "A better way to save and organize places from Google Maps",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-foreground flex flex-col min-h-screen`}>
        <AuthWrapper>
          <AnalyticsProvider>
            <Navbar />
            <div className="flex-grow pb-16 md:pb-0">
              {children}
            </div>
            <Footer />
            <MobileBottomNav />
            <FirebaseDebug />
          </AnalyticsProvider>
        </AuthWrapper>
      </body>
    </html>
  );
}
