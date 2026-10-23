jest.mock('../src/services/telemetry', () => ({ telemetry: { capture: jest.fn() } }));

import { telemetry } from '../src/services/telemetry';
import { trackAppOpened } from '../src/services/appOpens';

describe('trackAppOpened', () => {
  it('app_opened carries only day_index', () => {
    trackAppOpened(new Date(2026, 9, 18, 22).toISOString(), new Date(2026, 9, 20, 7));
    expect(telemetry.capture).toHaveBeenCalledWith('app_opened', { day_index: 2 });
  });

  it('install day is day 0', () => {
    trackAppOpened(new Date(2026, 9, 20, 6).toISOString(), new Date(2026, 9, 20, 23));
    expect(telemetry.capture).toHaveBeenLastCalledWith('app_opened', { day_index: 0 });
  });
});
