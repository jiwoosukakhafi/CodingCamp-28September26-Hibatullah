# Implementation Plan: Expense & Budget Visualizer

## Overview

Build a zero-dependency, single-page web application in three files (`index.html`, `css/style.css`, `js/script.js`) with Vanilla JavaScript, Chart.js via CDN, and `localStorage` persistence. The implementation follows the unidirectional data-flow architecture defined in the design: every user action mutates the in-memory `transactions` array, persists to `localStorage`, then triggers a full re-render of the list, balance, and pie chart.

A Vitest + fast-check test suite validates all 13 correctness properties defined in the design.

---

## Tasks

- [x] 1. Scaffold project structure and HTML skeleton
  - Create `index.html` at the workspace root with the full HTML skeleton from the design: `<header>` containing `#balance-container`, `<main>` with `#form-section`, `#chart-section`, and `#list-section`
  - Include the Chart.js v4 CDN script tag (`https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js`) before the closing `</body>`
  - Include `<link rel="stylesheet" href="css/style.css">` in `<head>`
  - Include `<script src="js/script.js" defer></script>` before the closing `</body>`, after the Chart.js script
  - Create empty placeholder files `css/style.css` and `js/script.js`
  - _Requirements: 7.1, 7.4, 7.5_

- [x] 2. Implement HTML form and transaction list markup
  - [x] 2.1 Build the Input_Form markup inside `#form-section`
    - Add `<form id="transaction-form">` with three `.field-group` wrappers
    - Item Name: `<input id="item-name" type="text" maxlength="100" autocomplete="off">` with adjacent `<span class="error-msg" id="item-name-error" aria-live="polite">`
    - Amount: `<input id="amount" type="number" step="0.01" min="0.01" max="999999999.99">` with adjacent `<span class="error-msg" id="amount-error" aria-live="polite">`
    - Category: `<select id="category">` with a disabled default option and options Food, Transport, Fun; adjacent `<span class="error-msg" id="category-error" aria-live="polite">`
    - Submit `<button type="submit">Add Transaction</button>`
    - _Requirements: 1.1, 1.7_

  - [x] 2.2 Build the transaction list and chart canvas markup
    - Add `<canvas id="pie-chart">` inside `#chart-section`
    - Add `<ul id="transaction-list" aria-live="polite">` inside `#list-section`
    - _Requirements: 2.1, 4.1_

- [x] 3. Implement mobile-first CSS styles
  - [x] 3.1 Write base (mobile) styles
    - Use `display: flex; flex-direction: column` on `<main>` with `gap: 1rem; padding: 1rem`
    - Style `<header>` to show balance prominently at the top of the viewport
    - Style `.field-group` inputs, selects, and the submit button with `min-height: 44px; min-width: 44px` and `width: 100%`
    - Style `.error-msg` spans for inline error display (visible in red, hidden when empty)
    - Style `#transaction-list` with `overflow-y: auto` and a `max-height` to enable scrolling
    - Use `rem` for all font sizes and `%`/`fr` for layout dimensions
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 3.2 Write responsive breakpoint styles
    - At `min-width: 600px`: switch `<main>` to `display: grid; grid-template-columns: 1fr 1fr; grid-template-areas: "form chart" "list list"`
    - At `min-width: 1024px`: switch to `grid-template-columns: 320px 1fr 320px; grid-template-areas: "form chart list"`
    - Apply `grid-area` assignments to `#form-section`, `#chart-section`, `#list-section`
    - Maintain `min-height: 44px; min-width: 44px` on all interactive elements at all breakpoints
    - _Requirements: 6.2, 6.3, 6.4, 6.5_

- [x] 4. Implement JavaScript constants, state, and persistence layer
  - [x] 4.1 Write constants and state declaration in `js/script.js`
    - Define `const STORAGE_KEY = 'expense_budget_transactions'`
    - Define `const CATEGORIES = ['Food', 'Transport', 'Fun']`
    - Declare `let transactions = []` and `let pieChart = null`
    - Add JSDoc `@typedef` for `Transaction` and `ValidationResult` as shown in the design
    - _Requirements: 5.5, 7.4_

  - [x] 4.2 Implement `loadTransactions()` and `saveTransactions()`
    - `loadTransactions()`: wrap `localStorage.getItem` + `JSON.parse` in `try/catch`; after parsing, filter entries using the validation guard from the design (checks `id`, `name`, `amount`, `category` types and ranges); return `[]` on any error or if the stored value is not an array
    - `saveTransactions()`: wrap `localStorage.setItem` in `try/catch`; on failure call `showGlobalError('Data could not be saved. Changes may be lost on refresh.')` and return `false`; return `true` on success
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6_

  - [ ]* 4.3 Write property test for serialization round-trip (Property 12)
    - **Property 12: Serialization round-trip preserves all transaction data**
    - **Validates: Requirements 5.1, 5.2, 5.3**
    - Set up Vitest with `environment: 'jsdom'` and install fast-check as a dev dependency
    - Create `tests/persistence.test.js`; use `fc.array(transactionArb)` to verify `saveTransactions()` followed by `loadTransactions()` returns a deeply equal array
    - Tag: `// Feature: expense-budget-visualizer, Property 12: Serialization round-trip`

  - [ ]* 4.4 Write property test for init from pre-populated storage (Property 13)
    - **Property 13: Initialization with pre-populated storage reproduces the stored list**
    - **Validates: Requirements 5.3**
    - In `tests/persistence.test.js`, write to `localStorage[STORAGE_KEY]` before calling `init()` and assert the rendered list matches the stored entries exactly
    - Tag: `// Feature: expense-budget-visualizer, Property 13: Init from pre-populated storage`

- [x] 5. Implement form validation
  - [x] 5.1 Implement `validateForm(name, rawAmount, category)`
    - Return `{ valid: true, errors: {} }` when: `name.trim().length >= 1 && name.length <= 100`, `parseFloat(rawAmount)` is finite and in `[0.01, 999999999.99]`, and `CATEGORIES.includes(category)`
    - Return `{ valid: false, errors: { itemName?, amount?, category? } }` with a non-empty error string for each violated field otherwise
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

  - [ ]* 5.2 Write property test for full validator correctness (Property 1)
    - **Property 1: Validator accepts only fully valid inputs**
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5**
    - Create `tests/validation.test.js`; use `fc.string()`, `fc.float()`, `fc.constantFrom(...CATEGORIES)`, and `fc.string()` to verify `result.valid` matches the expected predicate for 200 runs
    - Tag: `// Feature: expense-budget-visualizer, Property 1: Validator accepts only fully valid inputs`

  - [ ]* 5.3 Write property test for Item_Name rejection (Property 2)
    - **Property 2: Item_Name rejected when empty or over 100 characters**
    - **Validates: Requirements 1.2, 1.3**
    - In `tests/validation.test.js`; use `fc.string({ maxLength: 0 })` and `fc.string({ minLength: 101 })` as the name input
    - Tag: `// Feature: expense-budget-visualizer, Property 2: Item_Name rejected when empty or over 100 chars`

  - [ ]* 5.4 Write property test for Amount rejection (Property 3)
    - **Property 3: Amount rejected when out of range or non-numeric**
    - **Validates: Requirements 1.2, 1.4**
    - In `tests/validation.test.js`; use `fc.string()` for non-numeric and `fc.float({ max: 0.009 })` / `fc.float({ min: 1000000000 })` for out-of-range inputs
    - Tag: `// Feature: expense-budget-visualizer, Property 3: Amount rejected when out of range or non-numeric`

- [x] 6. Implement transaction list renderer
  - [x] 6.1 Implement `renderList()`
    - Clear `#transaction-list` inner HTML on each call
    - If `transactions` is empty, insert a `<li>` with the "no transactions recorded" message (Req 2.6)
    - Otherwise, for each transaction (newest-first, since `unshift` is used on add): create an `<li>` showing Category, truncated Item_Name (≤ 50 chars), and Amount; append a `<button class="delete-btn" data-id="...">Delete</button>` with the transaction id as a `data-id` attribute
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_

  - [ ]* 6.2 Write property test for list rendering correctness (Property 5)
    - **Property 5: Transaction list renders all fields with correct truncation**
    - **Validates: Requirements 2.1**
    - Create `tests/renderer.test.js`; use `fc.array(transactionArb)` to assert the DOM contains exactly n list items, each with the correct category, amount, and truncated name
    - Tag: `// Feature: expense-budget-visualizer, Property 5: Transaction list renders all fields with correct truncation`

  - [ ]* 6.3 Write property test for new transaction at head (Property 6)
    - **Property 6: New transaction appears at the head of the list**
    - **Validates: Requirements 2.3**
    - In `tests/renderer.test.js`; use `fc.array(transactionArb)` for a pre-existing list, add a new transaction, and assert the first `<li>` matches the new transaction
    - Tag: `// Feature: expense-budget-visualizer, Property 6: New transaction appears at the head`

  - [ ]* 6.4 Write property test for exactly one delete button per transaction (Property 7)
    - **Property 7: Each transaction has exactly one delete button**
    - **Validates: Requirements 2.4**
    - In `tests/renderer.test.js`; use `fc.array(transactionArb, { minLength: 1 })` and assert `querySelectorAll('.delete-btn').length === transactions.length`
    - Tag: `// Feature: expense-budget-visualizer, Property 7: Each transaction has exactly one delete button`

- [x] 7. Implement balance renderer
  - [x] 7.1 Implement `renderBalance()`
    - Compute `total = transactions.reduce((s, t) => s + t.amount, 0)`
    - Set `document.getElementById('balance-value').textContent = total.toFixed(2)`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 7.2 Write property test for balance equals sum (Property 9)
    - **Property 9: Total balance equals sum of all transaction amounts**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
    - Create `tests/balance.test.js`; use `fc.array(transactionArb)` and assert the DOM text equals `transactions.reduce((s, t) => s + t.amount, 0).toFixed(2)`
    - Tag: `// Feature: expense-budget-visualizer, Property 9: Total balance equals sum of all amounts`

  - [ ]* 7.3 Write property test for balance two-decimal format (Property 10)
    - **Property 10: Balance string always has exactly two decimal places**
    - **Validates: Requirements 3.5**
    - In `tests/balance.test.js`; assert `#balance-value` text always matches `/^\d+\.\d{2}$/`
    - Tag: `// Feature: expense-budget-visualizer, Property 10: Balance string always has two decimal places`

- [ ] 8. Implement Chart.js pie chart renderer
  - [ ] 8.1 Implement `renderChart()`
    - Compute `categoryTotals` and `activeCategories` as defined in the design's Derived State table
    - If `transactions` is empty: if `pieChart` is not null, call `pieChart.destroy()` and set `pieChart = null`; show a placeholder message in `#chart-section`
    - Guard against missing Chart.js: `if (typeof Chart === 'undefined') { /* show fallback */ return; }`
    - If `pieChart` is null: create a new `Chart` instance on `#pie-chart` canvas with the configuration from the design (type `'pie'`, colors `['#FF6384', '#36A2EB', '#FFCE56']`, legend at bottom, tooltip callback)
    - If `pieChart` is not null: mutate `pieChart.data.labels` and `pieChart.data.datasets[0].data`, then call `pieChart.update()`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [ ]* 8.2 Write property test for pie chart data correctness (Property 11)
    - **Property 11: Pie chart data reflects per-category totals**
    - **Validates: Requirements 4.2, 4.3, 4.4, 4.6, 4.7**
    - Create `tests/chart.test.js`; mock `window.Chart` to capture the data passed to the constructor and via `update()`; use `fc.array(transactionArb)` and assert the captured labels and data arrays match `CATEGORIES.filter(c => total[c] > 0)` and their totals
    - Tag: `// Feature: expense-budget-visualizer, Property 11: Pie chart data reflects per-category totals`

- [ ] 9. Implement event handlers and form submission flow
  - [ ] 9.1 Implement the form submit event handler
    - Clear all `.error-msg` spans at the start of each submit
    - Read `item-name`, `amount`, and `category` values from the DOM
    - Call `validateForm()`; if invalid, write each error message to its corresponding `<span>` and return
    - If valid: build a `Transaction` object with `id` from `crypto.randomUUID()` (or `Date.now().toString()` as fallback), `name`, `amount: parseFloat(rawAmount)`, `category`
    - Call `transactions.unshift(newTx)`; call `saveTransactions()`; call `renderList()`, `renderBalance()`, `renderChart()`; reset form fields within 100ms
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.3, 3.2, 4.3_

  - [ ] 9.2 Implement the delete button event handler using event delegation
    - Attach a single `'click'` listener on `#transaction-list`
    - Check `event.target.classList.contains('delete-btn')` and read `dataset.id`
    - Splice the matching transaction from `transactions`
    - Call `saveTransactions()`; if it returns `false`, re-insert the transaction and re-render (Req 2.7)
    - If save succeeds, call `renderList()`, `renderBalance()`, `renderChart()`
    - _Requirements: 2.5, 2.7, 3.3, 4.4_

  - [ ]* 9.3 Write property test for form reset after successful add (Property 4)
    - **Property 4: Form resets after a successful addition**
    - **Validates: Requirements 1.6**
    - In `tests/form.test.js`; use `fc.record({ name: validNameArb, rawAmount: validAmountArb, category: fc.constantFrom(...CATEGORIES) })` and assert input values are empty/default after the handler runs
    - Tag: `// Feature: expense-budget-visualizer, Property 4: Form resets after successful addition`

  - [ ]* 9.4 Write property test for delete removes transaction completely (Property 8)
    - **Property 8: Deleting a transaction removes it completely**
    - **Validates: Requirements 2.5**
    - In `tests/form.test.js`; use `fc.array(transactionArb, { minLength: 1 })` and `fc.integer()` for the index; assert in-memory array, DOM, and localStorage all reflect `n − 1` transactions
    - Tag: `// Feature: expense-budget-visualizer, Property 8: Deleting a transaction removes it completely`

- [ ] 10. Implement `showGlobalError()` and `init()`
  - [ ] 10.1 Implement `showGlobalError(message)`
    - Create or reuse a `<div id="global-error-banner">` at the top of `<main>`
    - Set its text content to `message` and make it visible
    - Optionally add a dismiss button that hides the banner
    - _Requirements: 2.7, 5.6_

  - [ ] 10.2 Implement `init()`
    - Attach to `document.addEventListener('DOMContentLoaded', init)`
    - Call `loadTransactions()` and assign to `transactions`
    - Call `renderList()`, `renderBalance()`, `renderChart()`
    - Attach the form submit and delete event handlers
    - _Requirements: 5.3, 5.4_

- [ ] 11. Checkpoint — verify core functionality end-to-end
  - Ensure all tests pass, ask the user if questions arise.
  - Open `index.html` directly in a browser, add a few transactions, verify the list, balance, and chart update; then reload and confirm data persists.

- [ ] 12. Add CSS polish and global error banner styles
  - Style `#global-error-banner` as a dismissible banner (visible red/amber strip at the top of `<main>`)
  - Style `.delete-btn` to meet the 44px touch target requirement
  - Style the empty-state message in `#transaction-list`
  - Style the Chart.js fallback message in `#chart-section`
  - Style `#balance-value` for prominence (large font, bold)
  - Ensure no visual defects at 320px, 480px, 600px, 1024px, and 1440px viewport widths
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 13. Final checkpoint — all tests pass, cross-browser smoke test
  - Ensure all tests pass, ask the user if questions arise.
  - Run `npx vitest --run` and confirm all property-based and unit tests pass.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP build.
- Each task references the specific requirement clauses it satisfies for full traceability.
- Checkpoints (tasks 11 and 13) ensure incremental validation at natural break points.
- Property tests require Vitest (`npm install -D vitest`) and fast-check (`npm install -D fast-check`) as dev dependencies. Run with `npx vitest --run` (single execution, no watch mode).
- A `transactionArb` arbitrary must be defined once in a shared test helper and reused across all property test files:
  ```js
  const transactionArb = fc.record({
    id: fc.string({ minLength: 1 }),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    amount: fc.float({ min: 0.01, max: 999999999.99 }),
    category: fc.constantFrom('Food', 'Transport', 'Fun')
  });
  ```
- The `js/script.js` functions (`validateForm`, `loadTransactions`, `saveTransactions`, `renderList`, `renderBalance`, `renderChart`) must be exported (or made available via module pattern) for the test suite to import them.

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "2.2", "4.1"] },
    { "id": 1, "tasks": ["3.1", "4.2", "5.1"] },
    { "id": 2, "tasks": ["3.2", "4.3", "4.4", "5.2", "5.3", "5.4", "6.1", "7.1"] },
    { "id": 3, "tasks": ["6.2", "6.3", "6.4", "7.2", "7.3", "8.1", "9.1", "9.2"] },
    { "id": 4, "tasks": ["8.2", "9.3", "9.4", "10.1", "10.2"] },
    { "id": 5, "tasks": ["12.1"] }
  ]
}
```
