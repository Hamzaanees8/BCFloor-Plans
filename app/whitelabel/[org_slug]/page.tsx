import { redirect } from 'next/navigation';





export default async function Page({ params }: { params: Promise<{ org_slug: string }> }) {
  await params;
  // Redirect to the general branded login page instead of forcing agent/vendor
  redirect(`/login`);
}
