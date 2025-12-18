# Copilot Instructions for Simple Settlement App

## Project Overview
This is a vanilla JavaScript web application for calculating settlement amounts (清算仕訳ツール). It consists of static HTML, CSS, and JS files with no build process or external dependencies.

## Architecture
- **Single-page application**: All logic in `script.js`, styling in `style.css`, structure in `index.html`
- **No backend**: Pure client-side calculation
- **Data flow**: User inputs → blur event → calculation → display result

## Key Patterns
- **Input parsing**: Use `parseIntSafe()` to handle comma-separated numbers (e.g., "10,000" → 10000)
- **Number formatting**: Use `formatNumber()` with "ja-JP" locale for display (e.g., 10000 → "10,000")
- **Calculation logic**: Core in `calculateResult(karibarai, seisan, otsuri)` - computes receive/pay/settled based on advance payment vs settlement
- **Event handling**: Attach "blur" listeners to inputs, trigger calculation only when karibarai > 0 and seisan > 0
- **UI updates**: Direct DOM manipulation via `textContent` for results

## Conventions
- **Language**: Japanese UI text and formatting
- **Styling**: CSS custom properties (variables) for colors, use Noto Sans JP font
- **Layout**: Card-based design with max-width 400px container
- **Inputs**: Text inputs with `inputmode="numeric"` for mobile keyboards
- **Reset**: Clear all inputs and reset result to "0"

## Workflows
- **Development**: Edit files directly, open `index.html` in browser to test
- **No build step**: Static files served as-is
- **No tests**: Manual testing by interacting with the form

## Examples
- Adding new input: Follow `.input-group` structure in `index.html`, add blur listener in `script.js`
- Styling: Use `--accent` variable for focus states, as in `.input:focus`
- Calculation extension: Modify `calculateResult()` to handle new settlement types