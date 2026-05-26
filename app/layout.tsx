import type { Metadata } from "next";
import { Alexandria, Geist, Geist_Mono, Raleway } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { getDefaultDomains } from "@/lib/config/domains";

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
import { OrganizationProvider } from "./context/OrganizationContext";

// interface WhitelabelInfo {
//   name: string;
//   logo: string;
//   primary_color: string;
//   secondary_color: string;
//   is_whitelabel: boolean;
// }

// async function getWhitelabelInfo(domain: string): Promise<WhitelabelInfo | null> {
//   try {
//     const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api-stage.bcfloorplans.com';
//     const baseApiUrl = rawApiUrl.replace(/\/api$/, ''); 
//     const res = await fetch(`${baseApiUrl}/api/domains/resolve?domain=${domain}`, {
//       next: { revalidate: 3600 },
//     });
//     if (!res.ok) return null;
//     return res.json();
//   } catch {
//     return null;
//   }
// }

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") || headersList.get("host") || "";
  console.log('>>> LAYOUT RESOLVED HOST:', host);
  console.log('--- LAYOUT ALL HEADERS ---');
  headersList.forEach((value, key) => {
    console.log(`  [Layout Header] ${key}: ${value}`);
  });
  console.log('--------------------------');


  let whitelabelData: any = null;

  // Fetch branding for any host that isn't bare localhost or a default system domain
  const domainWithoutPort = host.split(':')[0];
  const envDefaultDomains = getDefaultDomains();
  const defaultDomains = [
    ...envDefaultDomains,
    "booking-new.localhost",
    "teams-new.localhost",
    "vendors-new.localhost",
    "localhost",
    "127.0.0.1"
  ];

  const isDefaultDomain = defaultDomains.includes(domainWithoutPort);

  if (!isDefaultDomain) {
    try {
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://api-stage.bcfloorplans.com')
        .replace(/\/api\/?$/, '');
      const protocol = headersList.get("x-forwarded-proto") || "http";
      const fullBaseUrl = `${protocol}://${host}`;
      const fetchUrl = `${apiUrl}/api/domains/resolve?domain=${fullBaseUrl}`;
      console.log('Layout: fetching branding for', fullBaseUrl);

      const res = await fetch(fetchUrl, { next: { revalidate: 3600 } });
      if (res.ok) {
        whitelabelData = await res.json();
      }
    } catch (e) {
      console.error('Failed to fetch branding in layout:', e);
    }
  }

  // API returns colors as { value: "#..." } objects — extract the plain string
  const extractColor = (c: any, fallback: string) =>
    (typeof c === 'object' ? c?.value : c) || fallback;

  const brandedStyle = whitelabelData?.branding ? {
    '--org-primary': extractColor(whitelabelData.branding.primary_color, '#6BAE41'),
    '--org-secondary': extractColor(whitelabelData.branding.secondary_color, '#DC9600'),
    '--org-logo': whitelabelData.branding.logo ? `url(${whitelabelData.branding.logo})` : 'none',
    // Maintain legacy variables for compatibility
    '--primary-color': extractColor(whitelabelData.branding.primary_color, '#6BAE41'),
    '--secondary-color': extractColor(whitelabelData.branding.secondary_color, '#DC9600'),
    '--logo-url': whitelabelData.branding.logo ? `url(${whitelabelData.branding.logo})` : 'none',
  } as React.CSSProperties : {};

  return (
    <html lang="en">
      <head>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${alexandria.variable} ${raleway.variable} antialiased`}
        suppressHydrationWarning
      >
        <OrganizationProvider>
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
        </OrganizationProvider>
      </body>
    </html>
  );
}

