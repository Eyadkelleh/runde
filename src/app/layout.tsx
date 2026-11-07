import type { Metadata, Viewport } from "next";
import { Fraunces, Geist } from "next/font/google";
import { Suspense } from "react";
import { AppFrame, BottomNav, SideNav } from "@/components/app-shell";
import { DemoProvider } from "@/components/demo-provider";
import "./globals.css";

const sans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const serif = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: {
    default: "Runde",
    template: "%s · Runde",
  },
  description:
    "Kleine Treffen um eine Tätigkeit, an einem öffentlichen Ort, heute oder morgen. Lokale Demo ohne gemeinsamen Speicher.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#f3f0e8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className={`${sans.variable} ${serif.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <DemoProvider>
          <AppFrame
            side={
              <Suspense fallback={null}>
                <SideNav />
              </Suspense>
            }
            bottom={
              <Suspense fallback={null}>
                <BottomNav />
              </Suspense>
            }
          >
            {children}
          </AppFrame>
        </DemoProvider>
      </body>
    </html>
  );
}
