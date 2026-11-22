import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';

const repository = process.env.GITHUB_REPOSITORY;
const summary = process.env.GITHUB_STEP_SUMMARY;
const issueTitle = 'Update SECURITY.md supported versions';
const titleMarker = '<!-- labortracker-supported-versions-bot -->';

function api(path, ...flags) {
  return execFileSync('gh', ['api', `repos/${repository}/${path}`, ...flags], {
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  });
}

function highestStableSeries(tags) {
  const versions = tags.trim().split(/\r?\n/)
    .map(tag => /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(tag))
    .filter(Boolean)
    .map(match => match.slice(1).map(Number));

  versions.sort((a, b) => b[0] - a[0] || b[1] - a[1] || b[2] - a[2]);
  return versions.length ? `${versions[0][0]}.${versions[0][1]}.x` : null;
}

const tags = api('releases?per_page=100', '--paginate', '--jq',
  '.[] | select(.draft == false and .prerelease == false and .published_at != null) | .tag_name');
const series = highestStableSeries(tags);
const expected = [
  '| Version | Security support |',
  '| --- | --- |',
  '| Current hosted build | Supported |',
  ...(series ? [
    `| ${series} | Supported |`,
    '| Older release series | Routine security backports are unavailable |',
  ] : ['| Packaged releases | No stable GitHub release has been published |']),
].join('\n');

const policy = readFileSync('SECURITY.md', 'utf8').replace(/\r\n/g, '\n');
const table = policy.match(/<!-- supported-versions:start -->\n([\s\S]*?)\n<!-- supported-versions:end -->/)?.[1];
const current = table === expected;
const body = `${titleMarker}\nThe supported release series changed or the managed table is missing. Replace the table between the supported-versions markers in \`SECURITY.md\` with:\n\n${expected}`;

const issues = api('issues?state=open&per_page=100', '--paginate', '--jq',
  '.[] | select(.pull_request == null and .user.login == "github-actions[bot]") | @base64');
const existing = issues.trim().split(/\r?\n/).filter(Boolean)
  .map(line => JSON.parse(Buffer.from(line, 'base64').toString('utf8')))
  .find(issue => issue.title === issueTitle && issue.body?.startsWith(titleMarker));

if (!current && !existing) {
  api('issues', '--method', 'POST', '-f', `title=${issueTitle}`, '-f', `body=${body}`);
} else if (!current && existing.body !== body) {
  api(`issues/${existing.number}`, '--method', 'PATCH', '-f', `body=${body}`);
} else if (current && existing) {
  api(`issues/${existing.number}`, '--method', 'PATCH', '-f', 'state=closed');
}

const result = current ? 'SECURITY.md is current.' : 'Opened or updated the policy maintenance issue.';
appendFileSync(summary, `## Supported Versions\n\n${result}\n\n${expected}\n`);
