import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { ToastContainer } from "@/components/ToastContainer";
import NotificationListener from "@/components/NotificationListener";

export const metadata: Metadata = {
  title: "Tote • AI-Driven Market Linkage & Smart Cataloging for Marginalized Artisans",
  description:
    "An AI-powered virtual business manager empowering marginalized artisans and weavers with AI Studio photo enhancement, multilingual voice auto-cataloging, dynamic fair pricing, and year-round market linkages (B2B, GeM & ONDC). Ministry of Social Justice and Empowerment (MoSJE) initiative.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FCFAF6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased font-sans bg-background text-foreground"
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
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-accent selection:text-foreground" suppressHydrationWarning>
        {children}
        <ToastContainer />
        <NotificationListener />
      </body>
    </html>
  );
}
