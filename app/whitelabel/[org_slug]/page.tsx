import { redirect } from 'next/navigation';

interface WhitelabelInfo {
  is_whitelabel: boolean;
  portal_type?: 'agent' | 'vendor';
}

async function getWhitelabelInfo(slug: string): Promise<WhitelabelInfo | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api-stage.bcfloorplans.com';
    const res = await fetch(`${apiUrl}/api/v1/organizations/whitelabel-info?slug=${slug}`);
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    return null;
  }
}

export default async function Page({ params }: { params: Promise<{ org_slug: string }> }) {
  const { org_slug } = await params;
  // Redirect to the general branded login page instead of forcing agent/vendor
  redirect(`/login`);
}
