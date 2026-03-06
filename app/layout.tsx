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
        suppressHydrationWarning
      >
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
      </body>
    </html>
  );
}
