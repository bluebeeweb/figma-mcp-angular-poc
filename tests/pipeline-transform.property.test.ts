import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import { writeFileSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

// --- Helpers ---

const OUTPUT_FILE = resolve(process.cwd(), 'angular-app/src/styles/_tokens.css');
const ORIGINAL_FILE = resolve(process.cwd(), 'tokens/design-tokens.json');

let originalContent: string;

beforeAll(() => {
  originalContent = readFileSync(ORIGINAL_FILE, 'utf-8');
});

afterEach(() => {
  writeFileSync(ORIGINAL_FILE, originalContent, 'utf-8');
  // Rebuild with original tokens to restore clean state
  execSync('npm run build:tokens', { stdio: 'pipe' });
});

function buildTokens(): string {
  execSync('npm run build:tokens', { stdio: 'pipe' });
  return readFileSync(OUTPUT_FILE, 'utf-8');
}

function writeTokenFile(content: Record<string, unknown>): void {
  writeFileSync(ORIGINAL_FILE, JSON.stringify(content, null, 2), 'utf-8');
}

interface DesignToken {
  $value: string | number;
  $type: string;
}

function isLeafToken(obj: unknown): obj is DesignToken {
  return typeof obj === 'object' && obj !== null && '$value' in obj && '$type' in obj;
}

function countLeafTokens(obj: Record<string, unknown>): number {
  let count = 0;
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('$')) continue;
    if (isLeafToken(value)) {
      count++;
    } else if (typeof value === 'object' && value !== null) {
      count += countLeafTokens(value as Record<string, unknown>);
    }
  }
  return count;
}

function extractCssProperties(css: string): Map<string, string> {
  const props = new Map<string, string>();
  const regex = /--([\w-]+):\s*([^;]+);/g;
  let match;
  while ((match = regex.exec(css)) !== null) {
    props.set(`--${match[1]}`, match[2].trim());
  }
  return props;
}

/** Extract only the :root block content for alias checking */
function extractRootBlock(css: string): string {
  const match = css.match(/:root\s*\{([^}]*)\}/s);
  return match ? match[1] : '';
}

// --- Arbitraries ---

const colorValueArb = fc.hexaString({ minLength: 6, maxLength: 6 }).map(s => `#${s}`);
const dimensionValueArb = fc.integer({ min: 1, max: 100 }).map(n => `${n}px`);
const fontWeightValueArb = fc.constantFrom('100', '200', '300', '400', '500', '600', '700', '800', '900');
const numberValueArb = fc.double({ min: 0.5, max: 3, noNaN: true }).map(n => parseFloat(n.toFixed(2)));
const tokenNameArb = fc.stringMatching(/^[a-z][a-z0-9]{0,7}$/);

const colorGroupArb = fc.array(
  fc.tuple(tokenNameArb, colorValueArb),
  { minLength: 1, maxLength: 3 }
).map(entries =>
  Object.fromEntries(entries.map(([k, v]) => [k, { $value: v, $type: 'color' }]))
);

const spacingGroupArb = fc.array(
  fc.tuple(tokenNameArb, dimensionValueArb),
  { minLength: 1, maxLength: 3 }
).map(entries =>
  Object.fromEntries(entries.map(([k, v]) => [k, { $value: v, $type: 'dimension' }]))
);

const tokenFileArb = fc.record({
  color: colorGroupArb,
  spacing: spacingGroupArb,
});

// --- Property 3: Alias Resolution ---

/**
 * Feature: tokenized-design-system
 * Property 3: Alias Resolution
 * Validates: Requirements 2.3
 */
describe('Property 3: Alias Resolution', () => {
  it('generated CSS contains no DTCG alias syntax after pipeline processes alias references', () => {
    // Use lowercase-only names to avoid camelCase→kebab-case transform issues
    const lowerNameArb = fc.stringMatching(/^[a-z][a-z0-9]{0,7}$/);

    fc.assert(
      fc.property(colorValueArb, lowerNameArb, (baseColor, aliasName) => {
        fc.pre(aliasName !== 'base');

        const tokenFile = {
          color: {
            base: { $value: baseColor, $type: 'color' },
            [aliasName]: { $value: '{color.base}', $type: 'color' },
          },
        };
        writeTokenFile(tokenFile);
        const css = buildTokens();

        // Check only the :root block for DTCG alias syntax (not comments)
        const rootBlock = extractRootBlock(css);
        // DTCG aliases use {group.name} syntax — none should remain
        expect(rootBlock).not.toMatch(/\{[a-zA-Z][a-zA-Z0-9]*\.[a-zA-Z]/);

        // The alias token should appear as a CSS property
        const props = extractCssProperties(css);
        const resolvedValue = props.get(`--color-${aliasName}`);
        expect(resolvedValue).toBeDefined();
        // Value should be either a concrete value or a var() reference — not a DTCG alias
        expect(resolvedValue).not.toMatch(/^\{.*\}$/);
      }),
      { numRuns: 15 }
    );
  });
});

// --- Property 4: Pipeline Produces Valid CSS Output ---

/**
 * Feature: tokenized-design-system
 * Property 4: Pipeline Produces Valid CSS Output
 * Validates: Requirements 3.1, 3.2, 5.2
 */
describe('Property 4: Pipeline Produces Valid CSS Output', () => {
  it('output has :root selector with one CSS custom property per leaf token', () => {
    fc.assert(
      fc.property(tokenFileArb, (tokenFile) => {
        writeTokenFile(tokenFile);
        const css = buildTokens();

        // Must contain :root selector
        expect(css).toContain(':root');

        // Count leaf tokens in input
        const expectedCount = countLeafTokens(tokenFile);
        // Count CSS custom properties in output
        const props = extractCssProperties(css);
        expect(props.size).toBe(expectedCount);
      }),
      { numRuns: 20 }
    );
  });
});

// --- Property 5: Token Type Mapping Correctness ---

/**
 * Feature: tokenized-design-system
 * Property 5: Token Type Mapping Correctness
 * Validates: Requirements 3.3, 3.4, 3.5
 */
describe('Property 5: Token Type Mapping Correctness', () => {
  it('CSS property names follow kebab-case convention and values match input', () => {
    fc.assert(
      fc.property(
        colorValueArb,
        dimensionValueArb,
        fontWeightValueArb,
        numberValueArb,
        (color, dimension, fontWeight, lineHeight) => {
          const tokenFile = {
            color: {
              test: { $value: color, $type: 'color' },
            },
            spacing: {
              test: { $value: dimension, $type: 'dimension' },
            },
            typography: {
              test: {
                fontWeight: { $value: fontWeight, $type: 'fontWeight' },
                lineHeight: { $value: lineHeight, $type: 'number' },
              },
            },
          };
          writeTokenFile(tokenFile);
          const css = buildTokens();
          const props = extractCssProperties(css);

          // Verify kebab-case naming
          for (const key of props.keys()) {
            expect(key).toMatch(/^--[a-z][a-z0-9-]*$/);
          }

          // Verify values match input
          expect(props.get('--color-test')).toBe(color);
          expect(props.get('--spacing-test')).toBe(dimension);
          expect(props.get('--typography-test-font-weight')).toBe(fontWeight);
          expect(props.get('--typography-test-line-height')).toBe(String(lineHeight));
        }
      ),
      { numRuns: 15 }
    );
  });
});
