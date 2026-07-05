import PostHog from 'posthog-react-native';
import { sanitizeProperties } from '@/services/telemetryPrivacy';

const posthogApiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY || '';
const posthogHost = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

export const posthog = posthogApiKey
  ? new PostHog(posthogApiKey, { host: posthogHost })
  : null;

/**
 * Telemetry wrapper enforcing the privacy-first contract (see telemetryPrivacy).
 * Anonymous by default (no PII on identify); body-data props stripped on capture.
 */
export const telemetry = {
  // Associates events with an anonymous, stable user id only. Email/name are
  // deliberately NOT sent — analytics needs a cohort key, not an identity.
  identify: (userId: string, _email?: string, _name?: string) => {
    if (posthog) {
      posthog.identify(userId);
    } else {
      console.log('[Telemetry MOCK] Identify (anonymous):', userId);
    }
  },

  capture: (event: string, properties?: Record<string, any>) => {
    const safe = sanitizeProperties(properties);
    if (posthog) {
      posthog.capture(event, safe);
    } else {
      console.log('[Telemetry MOCK] Event:', event, safe);
    }
  },

  reset: () => {
    if (posthog) {
      posthog.reset();
    } else {
      console.log('[Telemetry MOCK] Reset');
    }
  }
};
