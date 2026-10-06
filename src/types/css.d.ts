// TypeScript 6 type-checks side-effect imports. NativeWind's entry stylesheet
// (`import './global.css'` in App.tsx) is handled by Metro, not TS — declare it.
declare module '*.css';
