export function propertyOptions(env = process.env) {
  const rawRuns = env.FC_NUM_RUNS;
  if (
    rawRuns !== undefined &&
    (!/^[1-9]\d*$/.test(rawRuns) || !Number.isSafeInteger(Number(rawRuns)))
  ) {
    throw new Error('FC_NUM_RUNS must be a positive safe integer');
  }
  const result = { numRuns: rawRuns === undefined ? 100 : Number(rawRuns) };
  if (env.FC_SEED !== undefined) {
    if (
      !/^-?\d+$/.test(env.FC_SEED) ||
      !Number.isSafeInteger(Number(env.FC_SEED)) ||
      Number(env.FC_SEED) < -2147483648 ||
      Number(env.FC_SEED) > 2147483647
    ) {
      throw new Error('FC_SEED must be a signed 32-bit integer');
    }
    result.seed = Number(env.FC_SEED);
  }
  if (env.FC_PATH !== undefined) {
    if (result.seed === undefined) throw new Error('FC_PATH requires FC_SEED');
    if (!/^\d+(?::\d+)*$/.test(env.FC_PATH))
      throw new Error('FC_PATH must be a replay path');
    result.path = env.FC_PATH;
  }
  return result;
}
