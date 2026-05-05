import type { Metadata } from "next";
import { Alexandria, Geist, Geist_Mono, Raleway } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Script from "next/script";
import { AppProvider } from "./context/AppContext";
import { OrderProvider } from "./dashboard/orders/context/OrderContext";
import { UploadQueueProvider } from '@/context/UploadQueueContext';
import { UploadProgressToast } from '@/components/upload/UploadProgressToast';
import { GlobalFileUploadProvider } from '@/context/GlobalFileUploadContext';
import { GlobalUploadProgressOverlay } from '@/components/upload/GlobalUploadProgressOverlay';
import { GlobalDownloadProvider } from '@/context/GlobalDownloadContext';
import { GlobalDownloadProgressOverlay } from '@/components/download/GlobalDownloadProgressOverlay';

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

import { headers } from "next/headers";

interface WhitelabelInfo {
  name: string;
  logo: string;
  primary_color: string;
  secondary_color: string;
  is_whitelabel: boolean;
}

async function getWhitelabelInfo(domain: string): Promise<WhitelabelInfo | null> {
  try {
    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api-stage.bcfloorplans.com';
    const baseApiUrl = rawApiUrl.replace(/\/api$/, ''); 
    const res = await fetch(`${baseApiUrl}/api/domains/resolve?domain=${domain}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  
  const SYSTEM_DOMAINS = [
    'teams-new.bcfloorplans.com',
    'booking-new.bcfloorplans.com',
    'vendor-new.bcfloorplans.com',
    'main.d1wkf3elpe9tnb.amplifyapp.com',
    'bcfloorplans.com',
    'tujoco.com',
    'localhost:3000',
    'localhost'
  ];
  
  let whitelabelData: WhitelabelInfo | null = null;
  
  if (!SYSTEM_DOMAINS.includes(host)) {
    whitelabelData = await getWhitelabelInfo(host);
  }

  const brandedStyle = whitelabelData?.is_whitelabel ? {
    '--primary-color': whitelabelData.primary_color || '#6BAE41',
    '--secondary-color': whitelabelData.secondary_color || '#DC9600',
    '--logo-url': whitelabelData.logo ? `url(${whitelabelData.logo})` : 'none',
  } as React.CSSProperties : {};

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
        suppressHydrationWarning
      >
        <div id="global-whitelabel-root" style={brandedStyle}>
          <GlobalFileUploadProvider>
            <GlobalDownloadProvider>
              <UploadQueueProvider>
                <OrderProvider>
                  <AppProvider>
                    {children}
                    <UploadProgressToast />
                    <GlobalUploadProgressOverlay />
                    <GlobalDownloadProgressOverlay />
                    <Toaster position="bottom-right" />
                  </AppProvider>
                </OrderProvider>
              </UploadQueueProvider>
            </GlobalDownloadProvider>
          </GlobalFileUploadProvider>
        </div>
      </body>
    </html>
  );
}
