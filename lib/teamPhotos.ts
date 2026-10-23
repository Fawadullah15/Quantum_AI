/**
 * Team Photo & Local Asset Fallback Mapping
 * Ensures that team portraits always resolve to high-res local assets
 * even when offline, on localhost, or if external Vercel blobs 404.
 */

export const TEAM_LOCAL_PHOTOS: Record<string, string> = {
  'muhammad-murtaza': '/images/team/muhammad-murtaza.jpg',
  'fahad-khan': '/images/team/fahad-khan.jpg',
  'abdullah-mahmook': '/images/team/abdullah-mahmood.png',
  'abdullah-mahmood': '/images/team/abdullah-mahmood.png',
  'hafizah-anisa-safdar': '/images/team/hafizah-anisa-safdar.jpeg',
  'waqas-ali-khan': '/images/team/waqas-ali-khan.png',
};

// Known dead Vercel Blob URLs that 404
const DEAD_BLOB_PATTERNS = [
  '1787049252241', // Murtaza old 404
  '1787049467020', // Fahad old 404
  '1787054190871', // Abdullah old 404
];

/**
 * Returns a reliable photo URL. If the given photoUrl is missing or points to a known dead blob,
 * it returns the local high-res asset for that member.
 */
export function getTeamPhoto(slug?: string | null, photoUrl?: string | null): string {
  if (!photoUrl) {
    return (slug && TEAM_LOCAL_PHOTOS[slug]) || '';
  }

  for (const pattern of DEAD_BLOB_PATTERNS) {
    if (photoUrl.includes(pattern)) {
      return (slug && TEAM_LOCAL_PHOTOS[slug]) || photoUrl;
    }
  }

  return photoUrl;
}

/**
 * Returns the local fallback path for a member by slug.
 */
export function getTeamFallbackPhoto(slug?: string | null): string {
  if (!slug) return '';
  return TEAM_LOCAL_PHOTOS[slug] || '';
}
