// README.md의 목차를 주제 폴더의 노트 목록으로 다시 쓴다.
// 사용법: node scripts/generate-toc.mjs
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const README = join(ROOT, 'README.md');

const START = '<!-- TOC:START - 자동 생성되는 영역입니다. 직접 수정하지 마세요. -->';
const END = '<!-- TOC:END -->';

// 노트가 아닌 폴더
const EXCLUDED_DIRS = new Set(['assets', 'scripts', 'node_modules']);

// 주제 폴더별 이모지. 여기에 없는 폴더는 DEFAULT_EMOJI로 표시된다.
const EMOJI = {
  auth: '🔐',
  'error-handling': '⚠️',
  performance: '⚡',
};
const DEFAULT_EMOJI = '📁';

const byName = (a, b) => a.localeCompare(b, 'en');

// error-handling -> Error Handling
const toTitle = (dir) =>
  dir
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

// 노트의 첫 번째 "# 제목" 줄. 없으면 파일명을 쓴다.
const readNoteTitle = (path, fallback) => {
  const heading = readFileSync(path, 'utf8').match(/^#\s+(.+?)\s*$/m);
  return heading ? heading[1] : fallback;
};

const topics = readdirSync(ROOT, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) => !name.startsWith('.') && !EXCLUDED_DIRS.has(name))
  .sort(byName);

const sections = [];
for (const topic of topics) {
  const notes = readdirSync(join(ROOT, topic))
    .filter((file) => file.endsWith('.md'))
    .sort(byName);
  if (notes.length === 0) continue;

  const links = notes.map((file) => {
    const title = readNoteTitle(join(ROOT, topic, file), file.replace(/\.md$/, ''));
    return `- [${title}](./${topic}/${encodeURI(file)})`;
  });
  sections.push([`### ${EMOJI[topic] ?? DEFAULT_EMOJI} ${toTitle(topic)}`, ...links].join('\n'));
}

const readme = readFileSync(README, 'utf8');
const startAt = readme.indexOf(START);
const endAt = readme.indexOf(END);
if (startAt === -1 || endAt === -1 || endAt < startAt) {
  console.error('README.md에서 TOC:START / TOC:END 마커를 찾지 못했습니다.');
  process.exit(1);
}

const toc = sections.length > 0 ? sections.join('\n\n') : '아직 노트가 없습니다.';
const next = `${readme.slice(0, startAt)}${START}\n${toc}\n${readme.slice(endAt)}`;

if (next === readme) {
  console.log('목차가 이미 최신입니다.');
} else {
  writeFileSync(README, next);
  console.log(`목차를 갱신했습니다. (주제 ${sections.length}개)`);
}
