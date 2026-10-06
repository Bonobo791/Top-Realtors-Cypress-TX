import { expect, test } from 'vitest';
import { propertyOptions } from './property-options.mjs';
test('template property controls reject invalid runs, seeds and unpaired replay paths', () => {
  for (const value of ['', '0', '-1', '1.2', '9007199254740992'])
    expect(() => propertyOptions({ FC_NUM_RUNS: value })).toThrow();
  expect(() => propertyOptions({ FC_SEED: '2147483648' })).toThrow();
  expect(() => propertyOptions({ FC_PATH: '0:1' })).toThrow();
  expect(
    propertyOptions({ FC_NUM_RUNS: '100', FC_SEED: '-42', FC_PATH: '0:1' }),
  ).toEqual({ numRuns: 100, seed: -42, path: '0:1' });
});
