import PostHog from 'posthog-react-native';

const posthogApiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY || '';
const posthogHost = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

export const posthog = posthogApiKey
  ? new PostHog(posthogApiKey, { host: posthogHost })
  : null;

/**
 * Standard Telemetry wrapper for cohort and event tracking.
 */
export const telemetry = {
  identify: (userId: string, email?: string, name?: string) => {
    if (posthog) {
      const props: Record<string, any> = {};
      if (email) props.email = email;
      if (name) props.name = name;
      
      posthog.identify(userId, props);
    } else {
      console.log('[Telemetry MOCK] Identify:', userId, { email, name });
    }
  },

  capture: (event: string, properties?: Record<string, any>) => {
    if (posthog) {
      posthog.capture(event, properties);
    } else {
      console.log('[Telemetry MOCK] Event:', event, properties);
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
