import { ReactNode } from 'react';

interface WhitelabelInfo {
  name: string;
  logo: string;
  primary_color: string;
  secondary_color: string;
  is_whitelabel: boolean;
}

async function getWhitelabelInfo(slug: string): Promise<WhitelabelInfo | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api-stage.bcfloorplans.com';
    const res = await fetch(`${apiUrl}/api/v1/organizations/whitelabel-info?slug=${slug}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('Failed to fetch whitelabel info:', error);
    return null;
  }
}

export default async function WhitelabelLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ org_slug: string }>;
}) {
  const { org_slug } = await params;
  const orgData = await getWhitelabelInfo(org_slug);

  if (!orgData || !orgData.is_whitelabel) {
    return <>{children}</>;
  }

  return (
    <div 
      id="whitelabel-wrapper"
      style={{
        '--primary-color': orgData.primary_color || '#000000',
        '--secondary-color': orgData.secondary_color || '#ffffff',
        '--logo-url': orgData.logo ? `url(${orgData.logo})` : 'none',
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
