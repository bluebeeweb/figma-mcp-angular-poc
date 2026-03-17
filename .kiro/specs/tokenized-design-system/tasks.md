# Implementation Plan: Tokenized Design System PoC

## Overview

This plan builds the PoC incrementally: repository scaffolding → token source files → Style Dictionary pipeline → Angular app → sync mechanisms → documentation. Each step produces working, testable output before moving on.

## Tasks

- [x] 1. Initialize repository structure and root configuration
  - [x] 1.1 Create root `package.json` with `name`, `scripts` (`build:tokens`), and dependencies (`style-dictionary` v4+)
    - Add `style-dictionary` as a dependency
    - Add `fast-check` and `vitest` as dev dependencies for pipeline testing
    - _Requirements: 7.3, 5.1_
  - [x] 1.2 Create `.gitignore` excluding `node_modules/`, `dist/`, `.angular/`, and IDE files
    - _Requirements: 7.4_
  - [x] 1.3 Create directory structure: `tokens/`, `.github/workflows/`
    - _Requirements: 7.1_

- [x] 2. Create token source files in W3C DTCG format
  - [x] 2.1 Create `tokens/design-tokens.json` with color, spacing, typography, and borderRadius groups
    - Use `$value` and `$type` fields per W3C DTCG spec
    - Include at minimum: primary/secondary/background/text colors, xs/sm/md/lg/xl spacing, heading/body typography, sm/md/lg border radii
    - _Requirements: 1.5, 2.1, 2.2_
  - [x] 2.2 Write property test for DTCG format compliance (Property 1)
    - **Property 1: DTCG Format Compliance**
    - Generate random token structures and validate every leaf has `$value` and `$type`
    - **Validates: Requirements 1.5, 2.1**
  - [x] 2.3 Write property test for token grouping structure (Property 2)
    - **Property 2: Token Grouping Structure**
    - Generate random token files and validate all leaves are under recognized group keys
    - **Validates: Requirements 2.2**

- [x] 3. Configure and implement Style Dictionary pipeline
  - [x] 3.1 Create `style-dictionary.config.mjs` with DTCG support (`usesDtcg: true`)
    - Source: `tokens/**/*.json`
    - Output: `angular-app/src/styles/_tokens.css`
    - Format: `css/variables` with `:root` selector and `outputReferences: true`
    - _Requirements: 3.1, 3.6_
  - [x] 3.2 Run `npm run build:tokens` and verify it generates `angular-app/src/styles/_tokens.css` with correct CSS custom properties
    - Verify `:root` selector, kebab-case naming, resolved values
    - _Requirements: 3.2, 3.3, 3.4, 3.5_
  - [x] 3.3 Write property test for alias resolution (Property 3)
    - **Property 3: Alias Resolution**
    - Generate token files with alias references, run pipeline, verify no alias syntax in CSS output
    - **Validates: Requirements 2.3**
  - [x] 3.4 Write property test for pipeline CSS output (Property 4)
    - **Property 4: Pipeline Produces Valid CSS Output**
    - Generate valid token JSON, run pipeline, verify output has `:root` with correct number of CSS custom properties
    - **Validates: Requirements 3.1, 3.2, 5.2**
  - [x] 3.5 Write property test for token type mapping (Property 5)
    - **Property 5: Token Type Mapping Correctness**
    - Generate tokens of each type, run pipeline, verify CSS property names follow kebab-case convention and values match input
    - **Validates: Requirements 3.3, 3.4, 3.5**
  - [x] 3.6 Write property test for invalid input rejection (Property 6)
    - **Property 6: Invalid Input Rejection**
    - Generate malformed JSON inputs (missing $value, missing $type, invalid syntax), verify non-zero exit
    - **Validates: Requirements 3.7**

- [x] 4. Checkpoint - Verify token pipeline
  - Ensure all tests pass, ask the user if questions arise.
  - Verify `npm run build:tokens` produces valid `_tokens.css` from the sample token file

- [x] 5. Scaffold Angular application
  - [x] 5.1 Scaffold Angular app in `angular-app/` using Angular CLI (v19+, standalone components, CSS styles)
    - Run `ng new angular-app --style=css --ssr=false --skip-git`
    - _Requirements: 4.1, 7.1_
  - [x] 5.2 Set up global styles to import generated tokens
    - Create `angular-app/src/styles/` directory
    - Move generated `_tokens.css` into it (already output there by Style Dictionary)
    - Update `angular-app/src/styles.css` to `@import './styles/_tokens.css'` and add base body styles using token vars with fallbacks
    - _Requirements: 4.2_

- [x] 6. Implement demo components consuming CSS custom properties
  - [x] 6.1 Create `demo-header` component
    - Use `var(--color-primary, ...)` for background, `var(--color-background, ...)` for text, `var(--spacing-md, ...)` for padding, `var(--typography-heading-font-size, ...)` for font size
    - _Requirements: 4.3, 4.4, 4.6_
  - [x] 6.2 Create `demo-button` component
    - Use `var(--color-primary, ...)` for background, `var(--spacing-sm, ...)` and `var(--spacing-md, ...)` for padding, `var(--border-radius-md, ...)` for border radius
    - _Requirements: 4.3, 4.4, 4.6_
  - [x] 6.3 Create `demo-card` component
    - Use `var(--spacing-lg, ...)` for padding, `var(--border-radius-md, ...)` for border radius, `var(--color-background, ...)` for background
    - _Requirements: 4.3, 4.4, 4.6_
  - [x] 6.4 Create `demo-text` component
    - Use `var(--typography-body-font-size, ...)`, `var(--typography-body-font-weight, ...)`, `var(--typography-body-line-height, ...)`, `var(--color-text, ...)`
    - _Requirements: 4.3, 4.4, 4.6_
  - [x] 6.5 Wire all demo components into `app.component` to create the demo page layout
    - Import and arrange header, button, card (containing text), in a clean layout
    - _Requirements: 4.4_
  - [x] 6.6 Write property test for component CSS var() usage with fallbacks (Property 7)
    - **Property 7: Component CSS Token References with Fallbacks**
    - Scan all component CSS files, verify every `var()` includes a token name and fallback value
    - **Validates: Requirements 4.3, 4.6**

- [x] 7. Checkpoint - Verify Angular app with tokens
  - Ensure all tests pass, ask the user if questions arise.
  - Verify the Angular app renders correctly with token-driven styles

- [x] 8. Implement sync mechanisms
  - [x] 8.1 Create GitHub Actions workflow `.github/workflows/build-tokens.yml`
    - Trigger on push to `tokens/**`
    - Steps: checkout, setup Node 20, npm ci, npm run build:tokens, commit and push updated CSS if changed
    - _Requirements: 5.3, 5.4, 5.5_

- [x] 9. Create documentation and presentation
  - [x] 9.1 Create `README.md` with project purpose, setup instructions, and end-to-end demo walkthrough
    - Include steps: change token in Tokens Studio → export JSON → commit to tokens/ → run `npm run build:tokens` → serve Angular app → observe changes
    - Cover color change demo (header + button) and spacing change demo (card padding)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.5_
  - [x] 9.2 Create `PRESENTATION.md` with presentation outline
    - Sections: Stateful Consistency, Maintainability, Single Source of Truth, Token Rehydration Flow
    - Include Mermaid diagram of end-to-end flow
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 10. Final checkpoint - Full pipeline verification
  - Ensure all tests pass, ask the user if questions arise.
  - Verify the complete flow: token JSON → Style Dictionary → CSS → Angular app renders with correct styles

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases
- The Angular app should be served manually by the user (`cd angular-app && ng serve`) — not started by the automation
