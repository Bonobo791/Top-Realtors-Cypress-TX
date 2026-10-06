import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
let commit = process.env.BUILD_COMMIT;
if (commit === undefined)
  commit = execFileSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim();
if (!/^[a-f0-9]{40}$/.test(commit) && commit !== 'local')
  throw new Error('BUILD_COMMIT must be a full commit SHA or local');
fs.writeFileSync(
  'dist/build.json',
  JSON.stringify(
    { commit, origin: 'https://toprealtorscypresstx.com', framework: 'Astro' },
    null,
    2,
  ) + '\n',
);
