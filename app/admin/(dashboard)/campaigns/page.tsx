import React from 'react';
import { getCampaigns, getCampaignStats } from './actions';
import { CampaignsClient } from './CampaignsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Announcements & Ads | Quantum AI Admin',
  description: 'Manage website advertisements, promotional popups, and announcement campaigns.',
};

export default async function CampaignsPage() {
  const [campaigns, stats] = await Promise.all([
    getCampaigns(),
    getCampaignStats(),
  ]);

  return (
    <CampaignsClient
      initialCampaigns={campaigns}
      initialStats={stats}
    />
  );
}
