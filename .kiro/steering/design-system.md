---
inclusion: always
---

# Design System Rules

## Token Architecture

This project uses a tokenized design system with the following pipeline:

**Figma (Tokens Studio) → W3C DTCG JSON → Style Dictionary → CSS Custom Properties → Angular Components**

## Token Source

- Token source file: `tokens/design-tokens.json`
- Format: W3C DTCG (`$value` and `$type` fields)
- Categories: color, spacing, typography, borderRadius

## Current Token Values

### Colors
- `--color-primary`: #1D2038 (dark navy)
- `--color-secondary`: #FF0045 (red)
- `--color-background`: #ffffff (white)
- `--color-text`: #111322 (near-black)

### Spacing
- `--spacing-xs`: 4px
- `--spacing-sm`: 8px
- `--spacing-md`: 16px
- `--spacing-lg`: 24px
- `--spacing-xl`: 32px

### Typography
- Font family: NeueHaasDisplay, system-ui, sans-serif
- Heading: 24px / 700 / 1.3
- Body: 16px / 400 / 1.5

### Border Radius
- `--border-radius-sm`: 4px
- `--border-radius-md`: 8px
- `--border-radius-lg`: 16px

## Component Rules

- All themeable styles MUST use `var(--token-name, fallback)` syntax
- Every `var()` reference MUST include a fallback value
- Components MUST NOT hardcode design values (colors, spacing, font sizes, border radii)
- New components should reference existing tokens, not introduce new raw values

## Figma Integration

- Treat Figma MCP output as a design reference, not final code
- Replace any Tailwind utility classes with CSS custom property `var()` references
- Reuse existing demo components (demo-header, demo-button, demo-card, demo-text) when possible
- Use the project's token-based color system, typography scale, and spacing tokens
- Strive for 1:1 visual parity with Figma designs using token references
- When conflicts arise between Figma output and token values, prefer token references

## File Conventions

- Component CSS files: `angular-app/src/app/components/{name}/{name}.css`
- Component templates: `angular-app/src/app/components/{name}/{name}.html`
- Component classes: `angular-app/src/app/components/{name}/{name}.ts`
- Generated tokens CSS: `angular-app/src/styles/_tokens.css` (do not edit directly)
- Global styles: `angular-app/src/styles.css`
