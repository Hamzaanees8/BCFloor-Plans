import type { Metadata } from "next";
import { Alexandria, Geist, Geist_Mono, Raleway } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Script from "next/script";
import { AppProvider } from "./context/AppContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const alexandria = Alexandria({
  subsets: ['latin'],
  variable: '--font-alexandria',
});
const raleway = Raleway({
  subsets: ['latin'],
  variable: '--font-raleway',
});
export const metadata: Metadata = {
  title: "BC Floor",
  description: "BC Floor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_PLACES_API_KEY}&libraries=places`}
          strategy="afterInteractive"
          async
          defer
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${alexandria.variable} ${raleway.variable} antialiased`}
      >
        <AppProvider>
          {children}
        </AppProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
