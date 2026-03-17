# Tokenized Design System PoC

A proof-of-concept demonstrating an end-to-end design token pipeline: design tokens managed in Figma (via Tokens Studio) are exported as W3C DTCG-compatible JSON, transformed into CSS custom properties by Style Dictionary, and consumed by an Angular application. A single token change in Figma propagates through the pipeline and visibly updates the Angular UI without modifying component code.

## Architecture

```
Figma + Tokens Studio
        │
        ▼ (export JSON)
   tokens/design-tokens.json
        │
        ▼ (Style Dictionary)
   angular-app/src/styles/_tokens.css
        │
        ▼ (global CSS import)
   Angular App components via var(--token-name)
```

## Repository Structure

```
├── tokens/                    # W3C DTCG token JSON source files
├── style-dictionary.config.mjs # Pipeline configuration
├── angular-app/               # Angular v19+ application
│   └── src/styles/_tokens.css # Generated CSS custom properties
├── tests/                     # Property-based tests (fast-check + vitest)
├── .github/workflows/         # GitHub Actions for automated token builds
├── package.json               # Root scripts and dependencies
└── PRESENTATION.md            # Presentation outline
```

## Prerequisites

- Node.js 20+
- npm 9+
- Angular CLI (`npm install -g @angular/cli`)

## Setup

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd tokenized-design-system
   ```

2. Install root dependencies (Style Dictionary, test tooling):

   ```bash
   npm install
   ```

3. Install Angular app dependencies:

   ```bash
   cd angular-app
   npm install
   cd ..
   ```

4. Build tokens (generates CSS custom properties from token JSON):

   ```bash
   npm run build:tokens
   ```

5. Serve the Angular app:

   ```bash
   cd angular-app
   ng serve
   ```

   Open `http://localhost:4200` in your browser.

## Running Tests

Property-based tests validate the token pipeline's correctness properties:

```bash
npm test
```

This runs all tests in `tests/` using vitest and fast-check.


## End-to-End Demo Walkthrough

This walkthrough demonstrates the full pipeline: changing a token value → rebuilding → seeing the change in the Angular app.

### Demo 1: Color Change (Header + Button)

This demo changes the primary color token, which affects the header background and button background.

1. Open `tokens/design-tokens.json` in your editor (or export updated JSON from Tokens Studio in Figma).

2. Change the primary color from the current value to a new color:

   ```json
   "color": {
     "primary": {
       "$value": "#7c3aed",
       "$type": "color"
     }
   }
   ```

3. Save the file and rebuild tokens:

   ```bash
   npm run build:tokens
   ```

4. Verify the generated CSS updated — open `angular-app/src/styles/_tokens.css` and confirm `--color-primary` now shows `#7c3aed`.

5. Reload the Angular app in your browser (or let `ng serve` hot-reload).

6. Observe: the header background and button background now display the new purple color. No component code was changed.

### Demo 2: Spacing Change (Card Padding)

This demo changes a spacing token, which affects the card component's internal padding.

1. Open `tokens/design-tokens.json`.

2. Change the `lg` spacing value from `24px` to `48px`:

   ```json
   "spacing": {
     "lg": {
       "$value": "48px",
       "$type": "dimension"
     }
   }
   ```

3. Rebuild tokens:

   ```bash
   npm run build:tokens
   ```

4. Reload the Angular app.

5. Observe: the card component now has noticeably more internal padding. Again, zero component code changes.

### Full Tokens Studio Workflow

When working with the complete Figma integration:

1. Open your Figma file with Tokens Studio installed.
2. Modify a token value in Tokens Studio (e.g., change `color.primary`).
3. Export the token set as JSON from Tokens Studio.
4. Copy the exported JSON file to `tokens/design-tokens.json` in this repository.
5. Commit the updated token file:

   ```bash
   git add tokens/design-tokens.json
   git commit -m "update: primary color token"
   git push
   ```

6. The GitHub Actions workflow automatically runs `npm run build:tokens` and commits the regenerated `_tokens.css`.
7. Pull the latest changes and serve the Angular app to see the updates.

   Alternatively, run `npm run build:tokens` locally for immediate feedback without waiting for CI.

## How It Works

- **Token source**: `tokens/design-tokens.json` uses the W3C DTCG format (`$value` and `$type` fields)
- **Pipeline**: `style-dictionary.config.mjs` reads token JSON, validates structure, resolves aliases, and outputs CSS custom properties to `angular-app/src/styles/_tokens.css`
- **Consumption**: Angular components reference tokens via `var(--token-name, fallback)` in their CSS — they never read token JSON directly
- **Automation**: GitHub Actions rebuilds tokens on any push to `tokens/` and auto-commits the updated CSS

## Token Categories

| Category     | Example Token          | CSS Custom Property                    |
|-------------|------------------------|----------------------------------------|
| Color       | `color.primary`        | `--color-primary: #1d2038`             |
| Spacing     | `spacing.md`           | `--spacing-md: 16px`                   |
| Typography  | `typography.heading.fontSize` | `--typography-heading-font-size: 24px` |
| Border Radius | `borderRadius.md`    | `--border-radius-md: 8px`             |

## License

This is a proof-of-concept project for internal demonstration purposes.
