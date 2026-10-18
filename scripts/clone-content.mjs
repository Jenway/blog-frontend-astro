import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

const token = process.env.GH_TOKEN;
const repository = 'github.com/Jenway/blog_content.git';
const target = resolve(process.cwd(), 'src', 'content');

if (!token) {
  throw new Error('GH_TOKEN is required to clone the content repository.');
}

rmSync(target, { recursive: true, force: true });

const authorization = Buffer.from(`x-access-token:${token}`, 'utf8').toString(
  'base64',
);

const result = spawnSync(
  'git',
  [
    '-c',
    `http.https://github.com/.extraheader=Authorization: Basic ${authorization}`,
    'clone',
    '--depth',
    '1',
    `https://${repository}`,
    target,
  ],
  { stdio: 'inherit' },
);

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  throw new Error(`git clone failed with exit code ${result.status}.`);
}
