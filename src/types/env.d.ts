declare namespace NodeJS {
  interface ProcessEnv {
    // Optional analytics (telemetry no-ops when unset). MoveKind has no backend:
    // all user data lives on the device, so there are no server keys.
    EXPO_PUBLIC_POSTHOG_API_KEY?: string;
    EXPO_PUBLIC_POSTHOG_HOST?: string;
  }
}
