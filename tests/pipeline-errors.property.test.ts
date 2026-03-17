import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import { writeFileSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

// --- Helpers ---

const ORIGINAL_FILE = resolve(process.cwd(), 'tokens/design-tokens.json');

let originalContent: string;

beforeAll(() => {
  originalContent = readFileSync(ORIGINAL_FILE, 'utf-8');
});

afterEach(() => {
  writeFileSync(ORIGINAL_FILE, originalContent, 'utf-8');
});

function buildTokensExitCode(): number {
  try {
    execSync('npm run build:tokens', { stdio: 'pipe' });
    return 0;
  } catch {
    return 1;
  }
}

const tokenNameArb = fc.stringMatching(/^[a-z][a-zA-Z0-9]{0,7}$/);

/**
 * Feature: tokenized-design-system
 * Property 6: Invalid Input Rejection
 * Validates: Requirements 3.7
 */
describe('Property 6: Invalid Input Rejection', () => {
  it('pipeline exits with non-zero code for tokens missing $value', () => {
    fc.assert(
      fc.property(tokenNameArb, (name) => {
        const malformed = {
          color: {
            [name]: { $type: 'color' }, // missing $value
          },
        };
        writeFileSync(ORIGINAL_FILE, JSON.stringify(malformed, null, 2), 'utf-8');
        const exitCode = buildTokensExitCode();
        expect(exitCode).not.toBe(0);
      }),
      { numRuns: 10 }
    );
  });

  it('pipeline exits with non-zero code for tokens missing $type', () => {
    fc.assert(
      fc.property(
        tokenNameArb,
        fc.hexaString({ minLength: 6, maxLength: 6 }),
        (name, hex) => {
          const malformed = {
            color: {
              [name]: { $value: `#${hex}` }, // missing $type
            },
          };
          writeFileSync(ORIGINAL_FILE, JSON.stringify(malformed, null, 2), 'utf-8');
          const exitCode = buildTokensExitCode();
          expect(exitCode).not.toBe(0);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('pipeline exits with non-zero code for invalid JSON syntax', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom('a', 'b', '{', '}', ':', '"', ',', ' '), { minLength: 5, maxLength: 30 }),
        (garbage) => {
          // Ensure it's actually invalid JSON
          let isValidJson = true;
          try { JSON.parse(garbage); } catch { isValidJson = false; }
          fc.pre(!isValidJson);

          writeFileSync(ORIGINAL_FILE, garbage, 'utf-8');
          const exitCode = buildTokensExitCode();
          expect(exitCode).not.toBe(0);
        }
      ),
      { numRuns: 10 }
    );
  });
});
