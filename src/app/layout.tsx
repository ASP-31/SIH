import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { QuickViewModal } from "@/components/QuickViewModal";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ToastContainer } from "@/components/ToastContainer";

export const metadata: Metadata = {
  title: "Tote • Handcrafted Totes by Independent Artisans",
  description:
    "A curated multi-vendor marketplace connecting independent tote bag artisans with conscious buyers. Canvas, crochet, waxed, and everyday slow-crafted totes.",
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
