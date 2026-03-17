import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// --- Constants ---

const COMPONENT_CSS_FILES = [
  'angular-app/src/app/components/demo-header/demo-header.css',
  'angular-app/src/app/components/demo-button/demo-button.css',
  'angular-app/src/app/components/demo-card/demo-card.css',
  'angular-app/src/app/components/demo-text/demo-text.css',
  'angular-app/src/app/app.css',
];

const VALID_GROUPS = ['color', 'spacing', 'typography', 'border-radius'];

// --- Helpers ---

interface VarReference {
  full: string;
  propertyName: string;
  fallback: string | undefined;
}

/** Extract all var() references from CSS content */
function extractVarReferences(css: string): VarReference[] {
  const refs: VarReference[] = [];
  // Match var( followed by content up to the balanced closing paren.
  // Captures: 1=custom property name, 2=optional fallback after first comma
  const regex = /var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)/g;
  let match;
  while ((match = regex.exec(css)) !== null) {
    refs.push({
      full: match[0],
      propertyName: match[1],
      fallback: match[2]?.trim(),
    });
  }
  return refs;
}

// --- Tests ---

/**
 * Feature: tokenized-design-system
 * Property 7: Component CSS Token References with Fallbacks
 * Validates: Requirements 4.3, 4.6
 */
describe('Property 7: Component CSS Token References with Fallbacks', () => {
  it('every var() in randomly selected component CSS files includes a token name and fallback value', () => {
    // Arbitrary that picks a random non-empty subset of component CSS files
    const cssFileSubsetArb = fc
      .subarray(COMPONENT_CSS_FILES, { minLength: 1 })
      .filter((arr) => arr.length > 0);

    fc.assert(
      fc.property(cssFileSubsetArb, (selectedFiles) => {
        for (const file of selectedFiles) {
          const filePath = resolve(process.cwd(), file);
          const css = readFileSync(filePath, 'utf-8');
          const refs = extractVarReferences(css);

          // Each file should have at least one var() reference
          expect(refs.length).toBeGreaterThan(0);

          for (const ref of refs) {
            // Must have a fallback value (second argument)
            expect(ref.fallback).toBeDefined();
            expect(ref.fallback!.length).toBeGreaterThan(0);

            // Custom property name must follow --{group}-{name} convention
            const nameWithoutPrefix = ref.propertyName.slice(2); // remove --
            const group = VALID_GROUPS.find((g) => nameWithoutPrefix.startsWith(g + '-'));
            expect(group).toBeDefined();
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});
