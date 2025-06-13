import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthWrapper from "@/components/auth/AuthWrapper";
import Footer from "@/components/layout/Footer";
import AnalyticsProvider from "@/components/analytics/AnalyticsProvider";
import MixpanelProvider from "@/components/analytics/MixpanelProvider";
import Navbar from "@/components/layout/Navbar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import VersionNotification from "@/components/version/VersionNotification";
import { VersionMeta } from "@/components/version/VersionedAssets";
// Using Supabase for authentication and database

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Placemarks - Organize Your Places",
  description: "A better way to save and organize places from Google Maps",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
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
            <MixpanelProvider>
              <VersionMeta />
              <Navbar />
              <div className="flex-grow pb-16 md:pb-0">
                {children}
              </div>
              <Footer />
              <MobileBottomNav />
              <VersionNotification />
              {/* Using Supabase for all backend services */}
            </MixpanelProvider>
          </AnalyticsProvider>
        </AuthWrapper>
      </body>
    </html>
  );
}
