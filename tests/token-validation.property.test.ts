import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// --- Helpers ---

const VALID_TYPES = ['color', 'dimension', 'fontWeight', 'fontFamily', 'number'] as const;
const RECOGNIZED_GROUPS = ['color', 'spacing', 'typography', 'borderRadius'] as const;

interface DesignToken {
  $value: string | number;
  $type: string;
}

function isLeafToken(obj: unknown): obj is DesignToken {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    '$value' in obj &&
    '$type' in obj
  );
}

function getLeafTokens(obj: Record<string, unknown>, path: string[] = []): { path: string[]; token: DesignToken }[] {
  const leaves: { path: string[]; token: DesignToken }[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('$')) continue;
    if (isLeafToken(value)) {
      leaves.push({ path: [...path, key], token: value as DesignToken });
    } else if (typeof value === 'object' && value !== null) {
      leaves.push(...getLeafTokens(value as Record<string, unknown>, [...path, key]));
    }
  }
  return leaves;
}

// --- Arbitraries ---

/** Generates a random leaf token with valid $value and $type */
const leafTokenArb: fc.Arbitrary<DesignToken> = fc.oneof(
  fc.record({
    $value: fc.hexaString({ minLength: 6, maxLength: 6 }).map((s) => `#${s}`),
    $type: fc.constant('color' as string),
  }),
  fc.record({
    $value: fc.integer({ min: 1, max: 100 }).map((n) => `${n}px`),
    $type: fc.constant('dimension' as string),
  }),
  fc.record({
    $value: fc.constantFrom('100', '200', '300', '400', '500', '600', '700', '800', '900'),
    $type: fc.constant('fontWeight' as string),
  }),
  fc.record({
    $value: fc.double({ min: 0.5, max: 3, noNaN: true }).map((n) => parseFloat(n.toFixed(2))),
    $type: fc.constant('number' as string),
  })
);

/** Generates a token group (1-5 leaf tokens keyed by name) */
const tokenGroupArb: fc.Arbitrary<Record<string, DesignToken>> = fc
  .array(
    fc.tuple(
      fc.stringMatching(/^[a-z][a-zA-Z0-9]{0,9}$/),
      leafTokenArb
    ),
    { minLength: 1, maxLength: 5 }
  )
  .map((entries) => Object.fromEntries(entries));

/** Generates a full token file with recognized group keys */
const tokenFileArb: fc.Arbitrary<Record<string, Record<string, DesignToken>>> = fc
  .record({
    color: tokenGroupArb,
    spacing: tokenGroupArb,
    typography: tokenGroupArb,
    borderRadius: tokenGroupArb,
  });

// --- Tests ---

/**
 * Feature: tokenized-design-system
 * Property 1: DTCG Format Compliance
 * Validates: Requirements 1.5, 2.1
 */
describe('Property 1: DTCG Format Compliance', () => {
  it('every leaf token in a generated structure has $value and $type with a valid type', () => {
    fc.assert(
      fc.property(tokenFileArb, (tokenFile) => {
        const leaves = getLeafTokens(tokenFile);
        expect(leaves.length).toBeGreaterThan(0);
        for (const { token } of leaves) {
          expect(token).toHaveProperty('$value');
          expect(token).toHaveProperty('$type');
          expect(VALID_TYPES).toContain(token.$type);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('the actual design-tokens.json file has valid DTCG format', () => {
    const filePath = resolve(process.cwd(), 'tokens/design-tokens.json');
    const content = JSON.parse(readFileSync(filePath, 'utf-8'));
    const leaves = getLeafTokens(content);

    expect(leaves.length).toBeGreaterThan(0);
    for (const { token } of leaves) {
      expect(token).toHaveProperty('$value');
      expect(token).toHaveProperty('$type');
      expect(VALID_TYPES).toContain(token.$type);
    }
  });
});

/**
 * Feature: tokenized-design-system
 * Property 2: Token Grouping Structure
 * Validates: Requirements 2.2
 */
describe('Property 2: Token Grouping Structure', () => {
  it('every leaf token in a generated structure is under a recognized group key', () => {
    fc.assert(
      fc.property(tokenFileArb, (tokenFile) => {
        const leaves = getLeafTokens(tokenFile);
        expect(leaves.length).toBeGreaterThan(0);
        for (const { path } of leaves) {
          expect(RECOGNIZED_GROUPS).toContain(path[0]);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('the actual design-tokens.json file has all tokens under recognized groups', () => {
    const filePath = resolve(process.cwd(), 'tokens/design-tokens.json');
    const content = JSON.parse(readFileSync(filePath, 'utf-8'));
    const leaves = getLeafTokens(content);

    expect(leaves.length).toBeGreaterThan(0);
    for (const { path } of leaves) {
      expect(RECOGNIZED_GROUPS).toContain(path[0]);
    }
  });
});
