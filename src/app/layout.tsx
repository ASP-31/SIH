import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { QuickViewModal } from "@/components/QuickViewModal";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ToastContainer } from "@/components/ToastContainer";

export const metadata: Metadata = {
  title: "Tote • AI-Driven Market Linkage & Smart Cataloging for Marginalized Artisans",
  description:
    "An AI-powered virtual business manager empowering marginalized artisans and weavers with AI Studio photo enhancement, multilingual voice auto-cataloging, dynamic fair pricing, and year-round market linkages (B2B, GeM & ONDC). Ministry of Social Justice and Empowerment (MoSJE) initiative.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FAFAF8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased font-sans bg-[#FAFAF8]"
      suppressHydrationWarning
    >
      <Script
        src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />
      <Script id="google-translate-init" strategy="afterInteractive">
        {`
          function googleTranslateElementInit() {
            new google.translate.TranslateElement({
              pageLanguage: 'en',
              includedLanguages: 'en,hi,bn,ta,te,mr,gu,kn,ml,pa,or,as',
              layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay: false
            }, 'google_translate_element');
          }
        `}
      </Script>
      <body className="min-h-full flex flex-col bg-[#FAFAF8] text-[#18181B] selection:bg-[#F2F0EB] selection:text-[#18181B]" suppressHydrationWarning>
        <Navbar />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <Footer />
        <CartDrawer />
        <QuickViewModal />
        <MobileBottomNav />
        <ToastContainer />
      </body>
    </html>
  );
}
