import { notFound } from 'next/navigation';
import CampaignComparison from '@/components/campaign-comparison';
import { campaigns, getCampaign } from '@/lib/campaigns';

export function generateStaticParams() {
  return Object.keys(campaigns).map((campaign) => ({ campaign }));
}

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ campaign: string }>;
}) {
  const { campaign: slug } = await params;
  const campaign = getCampaign(slug);
  if (!campaign) notFound();

  return <CampaignComparison key={campaign.slug} campaign={campaign} />;
}
