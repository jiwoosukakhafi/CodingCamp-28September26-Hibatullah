/* Expense & Budget Visualizer — application logic */

// ============================================================
// CONSTANTS & STATE
// ============================================================

/** Fixed key used to read/write transaction data in localStorage. */
const STORAGE_KEY = 'expense_budget_transactions';

/** Exhaustive list of valid spending categories. */
const CATEGORIES = ['Food', 'Transport', 'Fun'];

/**
 * @typedef {Object} Transaction
 * @property {string} id        - Unique identifier (crypto.randomUUID or Date.now().toString())
 * @property {string} name      - Item name (1–100 chars)
 * @property {number} amount    - Positive number (0.01 – 999999999.99)
 * @property {string} category  - One of CATEGORIES
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid
 * @property {{ itemName?: string, amount?: string, category?: string }} errors
 */

/** @type {Transaction[]} Single source of truth for all recorded transactions. */
let transactions = [];

/** @type {import('chart.js').Chart | null} Reference to the active Chart.js instance. */
let pieChart = null;
/**
 * Formats a number as Indonesian Rupiah with thousand separators (dots).
 * @param {number} amount - The amount to format
 * @returns {string} Formatted string like "Rp15.000" or "Rp1.250.000"
 */
function formatRupiah(amount) {
  const parts = amount.toFixed(0).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return 'Rp' + parts[0];
}

// ============================================================
// ERROR HANDLING
// ============================================================

/**
 * Displays a dismissible error banner at the top of <main>.
 * Reuses the #global-error-banner element defined in the HTML.
 * @param {string} message - Human-readable error description
 */
function showGlobalError(message) {
  const banner = document.getElementById('global-error-banner');
  if (!banner) return;

  // Clear previous content
  banner.innerHTML = '';

  const text = document.createElement('span');
  text.textContent = message;

  const dismissBtn = document.createElement('button');
  dismissBtn.className = 'dismiss-btn';
  dismissBtn.setAttribute('aria-label', 'Dismiss error');
  dismissBtn.textContent = '✕';
  dismissBtn.addEventListener('click', () => {
    banner.hidden = true;
  });

  banner.appendChild(text);
  banner.appendChild(dismissBtn);
  banner.hidden = false;
}

// ============================================================
// PERSISTENCE
// ============================================================

/**
 * Loads transactions from localStorage, validates each entry, and returns
 * the filtered array. Returns [] on any error or if storage is empty.
 *
 * @returns {Transaction[]}
 */
function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (t) =>
        typeof t.id === 'string' &&
        typeof t.name === 'string' && t.name.length > 0 &&
        typeof t.amount === 'number' && isFinite(t.amount) && t.amount >= 0.01 &&
        CATEGORIES.includes(t.category)
    );
  } catch {
    return [];
  }
}

/**
 * Persists the current `transactions` array to localStorage.
 * Calls showGlobalError() and returns false if the write fails.
 *
 * @returns {boolean} true on success, false on failure
 */
function saveTransactions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    return true;
  } catch {
    showGlobalError('Data could not be saved. Changes may be lost on refresh.');
    return false;
  }
}

// ============================================================
// VALIDATION
// ============================================================

/**
 * Validates the transaction form input values.
 * @param {string} name - raw value from #item-name input
 * @param {string} rawAmount - raw string value from #amount input
 * @param {string} category - value from #category select
 * @returns {ValidationResult}
 */
function validateForm(name, rawAmount, category) {
  const errors = {};

  // Validate name
  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    errors.itemName = 'Item name is required.';
  } else if (name.length > 100) {
    errors.itemName = 'Item name must be 100 characters or fewer.';
  }

  // Validate amount
  const parsedAmount = parseFloat(rawAmount);
  if (rawAmount === '' || rawAmount === null || rawAmount === undefined) {
    errors.amount = 'Amount is required.';
  } else if (!isFinite(parsedAmount)) {
    errors.amount = 'Amount must be a valid number.';
  } else if (parsedAmount < 0.01) {
    errors.amount = 'Amount must be at least 0.01.';
  } else if (parsedAmount > 999999999.99) {
    errors.amount = 'Amount must not exceed 999,999,999.99.';
  }

  // Validate category
  if (!CATEGORIES.includes(category)) {
    errors.category = 'Please select a category.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

// ============================================================
// RENDERERS
// ============================================================

/**
 * Full re-render of the transaction list.
 * Displays an empty-state message if there are no transactions.
 * New transactions are prepended via transactions.unshift(), so the
 * natural array order is newest-first.
 */
function renderList() {
  const ul = document.getElementById('transaction-list');
  ul.innerHTML = '';

  if (transactions.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty-state';
    li.textContent = 'No transactions recorded yet.';
    ul.appendChild(li);
    return;
  }

  transactions.forEach((tx) => {
    const li = document.createElement('li');
    li.className = 'transaction-item';
    li.dataset.id = tx.id;

    // Truncate name to 50 chars for display (Req 2.1)
    const displayName = tx.name.length > 50 ? tx.name.slice(0, 50) + '…' : tx.name;

    li.innerHTML = `
      <div class="item-details">
        <span class="item-name" title="${tx.name.replace(/"/g, '&quot;')}">${displayName}</span>
        <span class="item-meta">${tx.category}</span>
      </div>
      <span class="item-amount">${formatRupiah(tx.amount)}</span>
      <button class="delete-btn" data-id="${tx.id}" aria-label="Delete ${displayName}">Delete</button>
    `;

    ul.appendChild(li);
  });
}

/**
 * Updates the #balance-value element with the sum of all transaction amounts.
 * Excludes any transactions with non-finite amounts (Req 3.6).
 * Always displays two decimal places (Req 3.5).
 */
function renderBalance() {
  const total = transactions.reduce((sum, tx) => {
    const amt = typeof tx.amount === 'number' && isFinite(tx.amount) ? tx.amount : 0;
    return sum + amt;
  }, 0);
  document.getElementById('balance-value').textContent = formatRupiah(total);
}

// ============================================================
// EVENT HANDLERS
// ============================================================

/**
 * Handles the transaction form submission.
 * Validates input, adds the transaction, updates state + UI.
 * @param {Event} event
 */
function handleFormSubmit(event) {
  event.preventDefault();

  const nameInput    = document.getElementById('item-name');
  const amountInput  = document.getElementById('amount');
  const categoryInput = document.getElementById('category');

  const name     = nameInput.value;
  const rawAmount = amountInput.value;
  const category = categoryInput.value;

  // Clear previous error messages
  document.getElementById('item-name-error').textContent = '';
  document.getElementById('amount-error').textContent    = '';
  document.getElementById('category-error').textContent  = '';

  const { valid, errors } = validateForm(name, rawAmount, category);

  if (!valid) {
    if (errors.itemName) document.getElementById('item-name-error').textContent = errors.itemName;
    if (errors.amount)   document.getElementById('amount-error').textContent   = errors.amount;
    if (errors.category) document.getElementById('category-error').textContent = errors.category;
    return;
  }

  // Build transaction object
  const newTx = {
    id:       (typeof crypto !== 'undefined' && crypto.randomUUID)
                ? crypto.randomUUID()
                : Date.now().toString(),
    name:     name.trim(),
    amount:   parseFloat(rawAmount),
    category: category
  };

  // Prepend so newest appears first (Req 2.3)
  transactions.unshift(newTx);
  saveTransactions();

  renderList();
  renderBalance();
  renderChart();

  // Reset form fields (Req 1.6 — within 100ms, synchronous here)
  nameInput.value     = '';
  amountInput.value   = '';
  categoryInput.value = '';
}

/**
 * Event delegation handler for delete buttons on the transaction list.
 * Uses a single listener on #transaction-list to catch all delete clicks.
 * Rolls back the delete if localStorage write fails (Req 2.7).
 * @param {Event} event
 */
function handleDeleteClick(event) {
  if (!event.target.classList.contains('delete-btn')) return;

  const id = event.target.dataset.id;
  const index = transactions.findIndex((tx) => tx.id === id);
  if (index === -1) return;

  // Remove from in-memory state
  const [removed] = transactions.splice(index, 1);

  // Attempt to persist; roll back if it fails (Req 2.7)
  const saved = saveTransactions();
  if (!saved) {
    transactions.splice(index, 0, removed); // re-insert at same position
    renderList();
    return;
  }

  renderList();
  renderBalance();
  renderChart();
}

/**
 * Fixed color palette indexed by CATEGORIES order:
 * Food = coral-red, Transport = sky-blue, Fun = amber
 */
const CATEGORY_COLORS = ['#FF6384', '#36A2EB', '#FFCE56'];

/**
 * Creates or updates the Chart.js pie chart.
 * - Guards against missing Chart.js (CDN failure).
 * - Destroys the chart when all transactions are deleted.
 * - Mutates chart data and calls update() rather than re-creating on each call.
 */
function renderChart() {
  const canvas = document.getElementById('pie-chart');
  const chartSection = document.getElementById('chart-section');

  // Guard: Chart.js CDN might have failed to load
  if (typeof Chart === 'undefined') {
    if (!chartSection.querySelector('.chart-fallback')) {
      const msg = document.createElement('p');
      msg.className = 'chart-fallback';
      msg.textContent = 'Chart unavailable — please check your connection.';
      chartSection.appendChild(msg);
    }
    return;
  }

  // Compute per-category totals
  const categoryTotals = Object.fromEntries(
    CATEGORIES.map((cat) => [
      cat,
      transactions
        .filter((tx) => tx.category === cat)
        .reduce((sum, tx) => sum + tx.amount, 0)
    ])
  );

  // Only include categories that have transactions
  const activeCategories = CATEGORIES.filter((cat) => categoryTotals[cat] > 0);
  const activeData = activeCategories.map((cat) => categoryTotals[cat]);
  const activeColors = activeCategories.map((cat) => CATEGORY_COLORS[CATEGORIES.indexOf(cat)]);

  // Empty state: destroy chart and show placeholder
  if (activeCategories.length === 0) {
    if (pieChart) {
      pieChart.destroy();
      pieChart = null;
    }
    // Show placeholder text if not already there
    if (!chartSection.querySelector('.chart-placeholder')) {
      // Remove any stale placeholders first
      chartSection.querySelectorAll('.chart-placeholder').forEach((el) => el.remove());
      const placeholder = document.createElement('p');
      placeholder.className = 'chart-placeholder';
      placeholder.textContent = 'Add transactions to see the spending breakdown.';
      chartSection.appendChild(placeholder);
    }
    return;
  }

  // Remove placeholder if present
  chartSection.querySelectorAll('.chart-placeholder').forEach((el) => el.remove());

  if (!pieChart) {
    // First render: create a new Chart instance
    pieChart = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: activeCategories,
        datasets: [{
          data: activeData,
          backgroundColor: activeColors,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.label}: Rp${ctx.parsed.toFixed(2)}`
            }
          }
        }
      }
    });
  } else {
    // Subsequent renders: mutate data and call update()
    pieChart.data.labels = activeCategories;
    pieChart.data.datasets[0].data = activeData;
    pieChart.data.datasets[0].backgroundColor = activeColors;
    pieChart.update();
  }
}

// ============================================================
// INIT
// ============================================================

/**
 * Application bootstrap.
 * Loads persisted data, renders initial state, attaches event handlers.
 */
function init() {
  // Load persisted transactions from localStorage
  transactions = loadTransactions();

  // Initial render
  renderList();
  renderBalance();
  renderChart();

  // Attach event handlers
  document.getElementById('transaction-form')
    .addEventListener('submit', handleFormSubmit);

  document.getElementById('transaction-list')
    .addEventListener('click', handleDeleteClick);
}

// Boot the app when the DOM is ready
document.addEventListener('DOMContentLoaded', init);
