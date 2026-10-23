/// <reference types="node" />
import fs from 'node:fs';
import path from 'node:path';

/**
 * User-facing text never uses em dashes: they read as machine-written. Comments may.
 * Scans every source file with comments stripped, so new screens are covered too.
 */
const SRC = path.resolve(__dirname, '../src');

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return sourceFiles(p);
    return /\.tsx?$/.test(e.name) && !e.name.endsWith('.d.ts') ? [p] : [];
  });
}

const withoutComments = (code: string) =>
  code
    .replace(/\/\*[\s\S]*?\*\//g, '') // block and JSX comments
    .replace(/(^|[^:'"`])\/\/.*$/gm, '$1'); // line comments (not the // in URLs)

describe('no em dashes in user-facing text', () => {
  it.each(sourceFiles(SRC).map((f) => [path.relative(SRC, f), f]))('%s', (_name, file) => {
    const offending = withoutComments(fs.readFileSync(file, 'utf8'))
      .split('\n')
      .filter((line) => line.includes('—'));
    expect(offending).toEqual([]);
  });
});
