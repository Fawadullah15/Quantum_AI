/**
 * Quantum AI Cookie & Storage Consent Management
 * 
 * Provides unified management of user consent preferences across
 * Strictly Necessary, Analytics, and Marketing categories.
 * 
 * Strictly Necessary: Always active (authentication, security, dismissal preferences).
 * Analytics: Gated (anonymous campaign telemetry /api/campaigns/track).
 * Marketing: Gated (promotional campaigns, conversion tracking).
 */

export interface ConsentPreferences {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  timestamp: string; // ISO 8601 string
  version: string;
}

export const CONSENT_STORAGE_KEY = 'qa_cookie_consent';
export const CONSENT_VERSION = '1.0';
export const CONSENT_UPDATE_EVENT = 'qa_cookie_consent_updated';
export const OPEN_PREFERENCES_EVENT = 'qa_open_cookie_preferences';

export const DEFAULT_CONSENT: ConsentPreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  timestamp: '',
  version: CONSENT_VERSION,
};

/**
 * Retrieve currently saved consent preferences from localStorage.
 * Returns null if the user has not yet made a choice.
 */
export function getStoredConsent(): ConsentPreferences | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<ConsentPreferences>;
    if (parsed && typeof parsed === 'object' && parsed.version === CONSENT_VERSION) {
      return {
        necessary: true,
        analytics: Boolean(parsed.analytics),
        marketing: Boolean(parsed.marketing),
        timestamp: parsed.timestamp || new Date().toISOString(),
        version: CONSENT_VERSION,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Save user consent preferences to localStorage and a first-party cookie.
 * Dispatches a custom event to notify active listeners (e.g., CampaignDisplay).
 */
export function saveConsent(preferences: {
  analytics: boolean;
  marketing: boolean;
}): ConsentPreferences {
  const fullConsent: ConsentPreferences = {
    necessary: true,
    analytics: Boolean(preferences.analytics),
    marketing: Boolean(preferences.marketing),
    timestamp: new Date().toISOString(),
    version: CONSENT_VERSION,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(fullConsent));

      // Also set a 1st-party cookie (365 days) with SameSite=Lax
      const cookieValue = encodeURIComponent(JSON.stringify(fullConsent));
      const maxAge = 365 * 24 * 60 * 60;
      document.cookie = `${CONSENT_STORAGE_KEY}=${cookieValue}; path=/; max-age=${maxAge}; SameSite=Lax`;

      // Dispatch event for reactive updates across components
      window.dispatchEvent(
        new CustomEvent<ConsentPreferences>(CONSENT_UPDATE_EVENT, {
          detail: fullConsent,
        })
      );
    } catch (err) {
      console.warn('[Consent] Could not write consent to storage:', err);
    }
  }

  return fullConsent;
}

/**
 * Check if the user has granted consent for a specific category.
 * Strictly necessary is always true.
 * Analytics & Marketing return false if consent has not been explicitly granted.
 */
export function hasConsentFor(category: 'necessary' | 'analytics' | 'marketing'): boolean {
  if (category === 'necessary') return true;

  const stored = getStoredConsent();
  if (!stored) return false;

  return Boolean(stored[category]);
}

/**
 * Trigger the preferences modal to open from anywhere (e.g., Footer button).
 */
export function openCookiePreferencesModal(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_PREFERENCES_EVENT));
  }
}

/**
 * Subscribe to consent updates. Returns an cleanup unsubscribe function.
 */
export function onConsentChange(
  callback: (consent: ConsentPreferences) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<ConsentPreferences>;
    if (customEvent.detail) {
      callback(customEvent.detail);
    } else {
      const current = getStoredConsent() || DEFAULT_CONSENT;
      callback(current);
    }
  };

  window.addEventListener(CONSENT_UPDATE_EVENT, handler);
  return () => window.removeEventListener(CONSENT_UPDATE_EVENT, handler);
}
