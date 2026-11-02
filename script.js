/**
 * Recipe Scaler - Pure Vanilla JavaScript
 * Complete, unabridged implementation with Theme Switching, Recipe Tags,
 * Live Auto-Scaling, Unit Conversions, and Reload Persistence.
 */

// Storage keys
const STORAGE_KEY = 'recipe_scaler_app_data_v4';
const THEME_STORAGE_KEY = 'recipe_scaler_theme_pref';

// Preset sample recipes for instant testing
const PRESETS = {
  cookies: {
    dishName: "Classic Golden Butter Cookies",
    tags: "Vegetarian, Dessert, Baking",
    servingsMakes: 24,
    servingsWanted: 48,
    ingredients: [
      { name: "All-Purpose Flour", amount: "2 1/4", unit: "cups" },
      { name: "Unsalted Butter (softened)", amount: "1", unit: "cups" },
      { name: "Granulated Sugar", amount: "0.75", unit: "cups" },
      { name: "Brown Sugar", amount: "0.75", unit: "cups" },
      { name: "Vanilla Extract", amount: "1", unit: "tsp" },
      { name: "Fine Sea Salt", amount: "0.5", unit: "tsp" }
    ]
  },
  pancakes: {
    dishName: "Fluffy Buttermilk Pancakes",
    tags: "Vegetarian, Breakfast, Quick & Easy",
    servingsMakes: 4,
    servingsWanted: 10,
    ingredients: [
      { name: "All-Purpose Flour", amount: "2", unit: "cups" },
      { name: "Buttermilk", amount: "1.5", unit: "cups" },
      { name: "Large Eggs", amount: "2", unit: "pcs" },
      { name: "Melted Butter", amount: "3", unit: "tbsp" },
      { name: "Baking Powder", amount: "2", unit: "tsp" }
    ]
  },
  pasta: {
    dishName: "Creamy Garlic Alfredo",
    tags: "Vegetarian, Italian, Dinner",
    servingsMakes: 2,
    servingsWanted: 6,
    ingredients: [
      { name: "Fettuccine Pasta", amount: "250", unit: "grams" },
      { name: "Heavy Cream", amount: "1 1/4", unit: "cups" },
      { name: "Grated Parmesan", amount: "100", unit: "grams" },
      { name: "Garlic Cloves (minced)", amount: "4", unit: "pcs" },
      { name: "Fresh Parsley", amount: "2", unit: "tbsp" }
    ]
  }
};

// Culinary Unit Conversion Multipliers (Base: ml for volume, grams for mass)
const UNIT_DEFINITIONS = {
  volume: {
    "ml": 1,
    "liters": 1000,
    "tsp": 5,
    "tbsp": 15,
    "fl oz": 29.5735,
    "cups": 240,
    "pints": 480,
    "quarts": 960
  },
  mass: {
    "grams": 1,
    "kg": 1000,
    "oz": 28.3495,
    "lb": 453.592
  },
  count: {
    "pcs": 1,
    "slices": 1,
    "cloves": 1,
    "pinches": 1
  }
};

const ALL_COMMON_UNITS = [
  "grams",
  "cups",
  "tbsp",
  "tsp",
  "pcs",
  "ml",
  "oz",
  "lb",
  "kg",
  "liters",
  "fl oz",
  "pinches",
  "slices",
  "cloves"
];

// DOM Element References
let dishNameInput;
let recipeTagsInput;
let servingsMakesInput;
let servingsWantedInput;
let ingredientsContainer;
let recipeForm;
let errorBanner;
let errorMessageEl;
let dismissErrorBtn;
let addIngredientBtn;
let removeIngredientBtn;
let clearFormBtn;
let bottomResetBtn;
let ratioPreviewEl;
let ratioValueEl;
let ratioHintEl;
let resultsCardEl;
let emptyStateCardEl;
let resultDishTitleEl;
let resultTagsContainer;
let summaryOrigServingsEl;
let summaryTargetServingsEl;
let summaryFactorEl;
let resultsTableBodyEl;
let cookingChecklistEl;
let copyResultsBtn;
let copyBtnText;
let printResultsBtn;
let fmtDecimalBtn;
let fmtFractionBtn;
let fmtBothBtn;
let quickConvertAmount;
let quickConvertFrom;
let quickConvertTo;
let quickConvertResult;
let toastEl;

// Application State
let currentTheme = 'bright'; // 'bright' (Default) | 'ambient' | 'dark'
let numberFormat = 'decimal'; // 'decimal' | 'fraction' | 'both'
let currentScaledData = null;
let ingredientUnitOverrides = {}; // Map of row index -> target unit override
let activeSelectedTags = {}; // Map of tag name -> boolean

/**
 * Initialize application when DOM is ready
 */
function init() {
  cacheElements();
  initThemeSystem();
  bindEvents();
  initQuickConverter();

  // Restore previous inputs & state from localStorage
  const restored = restoreFromLocalStorage();
  if (!restored) {
    createDefaultIngredientRows();
  }

  updateLiveScalePreview();
}

/**
 * Cache references to DOM elements
 */
function cacheElements() {
  dishNameInput = document.getElementById('dish-name');
  recipeTagsInput = document.getElementById('recipe-tags');
  servingsMakesInput = document.getElementById('servings-makes');
  servingsWantedInput = document.getElementById('servings-wanted');
  ingredientsContainer = document.getElementById('ingredients-container');
  recipeForm = document.getElementById('recipe-form');
  errorBanner = document.getElementById('error-banner');
  errorMessageEl = document.getElementById('error-message');
  dismissErrorBtn = document.getElementById('dismiss-error');
  addIngredientBtn = document.getElementById('add-ingredient-btn');
  removeIngredientBtn = document.getElementById('remove-ingredient-btn');
  clearFormBtn = document.getElementById('clear-form-btn');
  bottomResetBtn = document.getElementById('bottom-reset-btn');
  ratioPreviewEl = document.getElementById('ratio-preview');
  ratioValueEl = document.getElementById('ratio-value');
  ratioHintEl = document.getElementById('ratio-hint');
  resultsCardEl = document.getElementById('results-card');
  emptyStateCardEl = document.getElementById('empty-state-card');
  resultDishTitleEl = document.getElementById('result-dish-title');
  resultTagsContainer = document.getElementById('result-tags-container');
  summaryOrigServingsEl = document.getElementById('summary-orig-servings');
  summaryTargetServingsEl = document.getElementById('summary-target-servings');
  summaryFactorEl = document.getElementById('summary-factor');
  resultsTableBodyEl = document.getElementById('results-table-body');
  cookingChecklistEl = document.getElementById('cooking-checklist');
  copyResultsBtn = document.getElementById('copy-results-btn');
  copyBtnText = document.getElementById('copy-btn-text');
  printResultsBtn = document.getElementById('print-results-btn');
  fmtDecimalBtn = document.getElementById('fmt-decimal');
  fmtFractionBtn = document.getElementById('fmt-fraction');
  fmtBothBtn = document.getElementById('fmt-both');
  quickConvertAmount = document.getElementById('quick-convert-amount');
  quickConvertFrom = document.getElementById('quick-convert-from');
  quickConvertTo = document.getElementById('quick-convert-to');
  quickConvertResult = document.getElementById('quick-convert-result');
  toastEl = document.getElementById('toast');
}

/**
 * Initialize theme system (Default: bright mode)
 */
function initThemeSystem() {
  let savedTheme = 'bright';
  try {
    savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'bright';
  } catch (e) {}

  applyTheme(savedTheme);

  document.querySelectorAll('.theme-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const theme = btn.getAttribute('data-theme');
      applyTheme(theme);
    });
  });
}

/**
 * Apply selected theme to document
 */
function applyTheme(theme) {
  if (!['bright', 'ambient', 'dark'].includes(theme)) {
    theme = 'bright';
  }
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);

  document.querySelectorAll('.theme-btn').forEach(function (btn) {
    if (btn.getAttribute('data-theme') === theme) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (e) {}
}

/**
 * Bind DOM event listeners
 */
function bindEvents() {
  // Manual form submission trigger
  recipeForm.addEventListener('submit', function (e) {
    e.preventDefault();
    scaleRecipe({ scrollIntoView: true });
  });

  // Paired (+ / -) Ingredient buttons
  addIngredientBtn.addEventListener('click', function () {
    addIngredientRow();
    renumberRows();
    saveToLocalStorage();
    tryLiveAutoScaling();
  });

  removeIngredientBtn.addEventListener('click', function () {
    removeLastIngredientRow();
  });

  // Seamless Clear Form button with temporary "Cleared" pop-up
  clearFormBtn.addEventListener('click', function () {
    executeFormReset();
  });

  // Bottom Reset Button
  bottomResetBtn.addEventListener('click', function () {
    executeFormReset();
  });

  // Dismiss error banner
  dismissErrorBtn.addEventListener('click', function () {
    hideErrorBanner();
  });

  // Preset Sample Recipes
  document.querySelectorAll('.preset-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const presetKey = btn.getAttribute('data-preset');
      loadPreset(presetKey);
    });
  });

  // Quick tag chips (1-click tag additions)
  document.querySelectorAll('.quick-tag-chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      const tagText = chip.getAttribute('data-tag');
      appendTagToInput(tagText);
    });
  });

  // Live input changes
  dishNameInput.addEventListener('input', function () {
    saveToLocalStorage();
    if (currentScaledData) {
      resultDishTitleEl.textContent = sanitizeText(this.value.trim()) || 'Scaled Recipe';
    }
  });

  recipeTagsInput.addEventListener('input', function () {
    saveToLocalStorage();
    if (currentScaledData) {
      renderResultTags(this.value);
    }
  });

  // LIVE AUTO-SCALING:
  // Recalculates output instantly when "Servings Wanted" changes
  servingsWantedInput.addEventListener('input', function () {
    handleServingsChange();
    tryLiveAutoScaling();
  });

  // Also auto-scales on "Servings Recipe Makes"
  servingsMakesInput.addEventListener('input', function () {
    handleServingsChange();
    tryLiveAutoScaling();
  });

  // Segmented format controls (Decimal, Fraction, Both)
  const formatButtons = [
    { btn: fmtDecimalBtn, fmt: 'decimal' },
    { btn: fmtFractionBtn, fmt: 'fraction' },
    { btn: fmtBothBtn, fmt: 'both' }
  ];

  formatButtons.forEach(function (item) {
    if (item.btn) {
      item.btn.addEventListener('click', function () {
        numberFormat = item.fmt;
        formatButtons.forEach(function (b) {
          if (b.btn) b.btn.classList.remove('active');
        });
        item.btn.classList.add('active');
        saveToLocalStorage();
        if (currentScaledData) {
          renderResults(currentScaledData);
        }
      });
    }
  });

  // Copy Scaled Recipe Button
  if (copyResultsBtn) {
    copyResultsBtn.addEventListener('click', copyResultsToClipboard);
  }

  // Print / Save PDF Button
  if (printResultsBtn) {
    printResultsBtn.addEventListener('click', function () {
      window.print();
    });
  }
}

/**
 * Append a tag to the recipe tags input field
 */
function appendTagToInput(tag) {
  let currentVal = recipeTagsInput.value.trim();
  const existingTags = currentVal ? currentVal.split(',').map(s => s.trim().toLowerCase()) : [];

  if (!existingTags.includes(tag.toLowerCase())) {
    if (currentVal) {
      recipeTagsInput.value = `${currentVal}, ${tag}`;
    } else {
      recipeTagsInput.value = tag;
    }
    saveToLocalStorage();
    if (currentScaledData) {
      renderResultTags(recipeTagsInput.value);
    }
    showToast(`Added tag "${tag}"`);
  } else {
    showToast(`Tag "${tag}" already added`);
  }
}

/**
 * Render clickable tag pill badges in results card
 */
function renderResultTags(tagsString) {
  if (!resultTagsContainer) return;

  const rawTags = (tagsString || '').split(',')
    .map(t => sanitizeText(t))
    .filter(t => t.length > 0);

  resultTagsContainer.innerHTML = '';

  if (rawTags.length === 0) {
    resultTagsContainer.style.display = 'none';
    return;
  }

  resultTagsContainer.style.display = 'flex';

  rawTags.forEach(function (tag) {
    const pill = document.createElement('span');
    pill.className = 'tag-pill';
    if (activeSelectedTags[tag.toLowerCase()]) {
      pill.classList.add('active');
    }
    pill.textContent = tag;
    pill.setAttribute('role', 'button');
    pill.setAttribute('tabindex', '0');
    pill.setAttribute('title', `Click to filter/highlight "${tag}"`);

    function toggleTag() {
      const isNowActive = !pill.classList.contains('active');
      pill.classList.toggle('active');
      activeSelectedTags[tag.toLowerCase()] = isNowActive;
      saveToLocalStorage();
      showToast(isNowActive ? `Tag "${tag}" active` : `Tag "${tag}" unselected`);
    }

    pill.addEventListener('click', toggleTag);
    pill.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleTag();
      }
    });

    resultTagsContainer.appendChild(pill);
  });
}

/**
 * Handle dynamic servings changes and instant guard clauses
 */
function handleServingsChange() {
  const makesVal = servingsMakesInput.value.trim();
  const wantedVal = servingsWantedInput.value.trim();

  const makes = parseFloat(makesVal);
  const wanted = parseFloat(wantedVal);

  // Guard Clause: If servings <= 0 or empty, immediately hide results
  if (makesVal === '' || wantedVal === '' || isNaN(makes) || isNaN(wanted) || makes <= 0 || wanted <= 0) {
    hideResults();
    currentScaledData = null;
    saveToLocalStorage();

    if ((makesVal !== '' && (isNaN(makes) || makes <= 0)) || (wantedVal !== '' && (isNaN(wanted) || wanted <= 0))) {
      showErrorBanner('Please enter valid serving numbers greater than 0.');
      if (isNaN(makes) || makes <= 0) {
        servingsMakesInput.classList.add('is-invalid');
      }
      if (isNaN(wanted) || wanted <= 0) {
        servingsWantedInput.classList.add('is-invalid');
      }
    } else {
      hideErrorBanner();
      servingsMakesInput.classList.remove('is-invalid');
      servingsWantedInput.classList.remove('is-invalid');
    }
  } else {
    servingsMakesInput.classList.remove('is-invalid');
    servingsWantedInput.classList.remove('is-invalid');
    hideErrorBanner();
    updateLiveScalePreview();
    saveToLocalStorage();
  }
}

/**
 * Live Auto-scaling trigger
 */
function tryLiveAutoScaling() {
  const makes = parseFloat(servingsMakesInput.value);
  const wanted = parseFloat(servingsWantedInput.value);

  if (!isNaN(makes) && !isNaN(wanted) && makes > 0 && wanted > 0) {
    const rows = ingredientsContainer.querySelectorAll('.ingredient-row');
    let hasValidAmount = false;
    rows.forEach(function (row) {
      const amt = parseFractionOrDecimal(row.querySelector('.ing-amount-input').value);
      if (amt > 0) hasValidAmount = true;
    });

    if (hasValidAmount) {
      scaleRecipe({ scrollIntoView: false, isLive: true });
    }
  }
}

/**
 * Unit conversion helper function
 * Converts an amount from one culinary unit to another if compatible.
 */
function convertUnit(amount, fromUnit, toUnit) {
  if (amount === 0 || isNaN(amount)) return 0;
  if (!fromUnit || !toUnit || fromUnit === toUnit) return amount;

  const f = normalizeUnit(fromUnit);
  const t = normalizeUnit(toUnit);

  // Volume conversion
  if (UNIT_DEFINITIONS.volume[f] && UNIT_DEFINITIONS.volume[t]) {
    const ml = amount * UNIT_DEFINITIONS.volume[f];
    return ml / UNIT_DEFINITIONS.volume[t];
  }

  // Mass / Weight conversion
  if (UNIT_DEFINITIONS.mass[f] && UNIT_DEFINITIONS.mass[t]) {
    const grams = amount * UNIT_DEFINITIONS.mass[f];
    return grams / UNIT_DEFINITIONS.mass[t];
  }

  return null;
}

/**
 * Normalize unit strings for matching
 */
function normalizeUnit(unit) {
  if (!unit) return '';
  const u = String(unit).trim().toLowerCase();

  if (u === 'g' || u === 'gram') return 'grams';
  if (u === 'kilogram' || u === 'kilograms') return 'kg';
  if (u === 'ounce' || u === 'ounces') return 'oz';
  if (u === 'pound' || u === 'pounds' || u === 'lbs') return 'lb';
  if (u === 'cup') return 'cups';
  if (u === 'tablespoon' || u === 'tablespoons') return 'tbsp';
  if (u === 'teaspoon' || u === 'teaspoons') return 'tsp';
  if (u === 'milliliter' || u === 'milliliters') return 'ml';
  if (u === 'liter' || u === 'l') return 'liters';
  if (u === 'piece' || u === 'pieces') return 'pcs';

  return u;
}

/**
 * Get compatible units for a given unit
 */
function getCompatibleUnits(unit) {
  const norm = normalizeUnit(unit);

  if (UNIT_DEFINITIONS.volume[norm]) {
    return Object.keys(UNIT_DEFINITIONS.volume);
  }
  if (UNIT_DEFINITIONS.mass[norm]) {
    return Object.keys(UNIT_DEFINITIONS.mass);
  }
  return [norm];
}

/**
 * Parse decimal and fractional amounts safely
 * Supports: "0.5", "1.25", ".75", "1/2", "3/4", "1 1/2", "2 1/4"
 */
function parseFractionOrDecimal(val) {
  if (typeof val === 'number') {
    return isNaN(val) || val < 0 ? 0 : val;
  }
  if (!val) return 0;

  const str = String(val).trim();
  if (!str) return 0;

  if (str.startsWith('-')) return 0;

  // Mixed fraction like "1 1/2"
  if (str.includes(' ')) {
    const parts = str.split(/\s+/);
    if (parts.length === 2 && parts[1].includes('/')) {
      const whole = parseFloat(parts[0]);
      const fracParts = parts[1].split('/');
      if (!isNaN(whole) && fracParts.length === 2) {
        const num = parseFloat(fracParts[0]);
        const den = parseFloat(fracParts[1]);
        if (!isNaN(num) && !isNaN(den) && den > 0) {
          const res = whole + num / den;
          return res >= 0 ? res : 0;
        }
      }
    }
  }

  // Simple fraction like "1/2"
  if (str.includes('/')) {
    const fracParts = str.split('/');
    if (fracParts.length === 2) {
      const num = parseFloat(fracParts[0]);
      const den = parseFloat(fracParts[1]);
      if (!isNaN(num) && !isNaN(den) && den > 0) {
        const res = num / den;
        return res >= 0 ? res : 0;
      }
    }
  }

  const num = parseFloat(str);
  if (isNaN(num) || num < 0) return 0;
  return num;
}

/**
 * Create 3 default blank rows
 */
function createDefaultIngredientRows() {
  ingredientsContainer.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    addIngredientRow();
  }
  renumberRows();
}

/**
 * Add an ingredient row to the container
 */
function addIngredientRow(data = {}) {
  const row = document.createElement('div');
  row.className = 'ingredient-row';

  const indexBadge = document.createElement('span');
  indexBadge.className = 'row-index';
  indexBadge.textContent = '1';

  // Ingredient Name Input
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'form-control ing-name-input';
  nameInput.placeholder = 'e.g. Flour';
  nameInput.value = data.name !== undefined ? data.name : '';
  nameInput.setAttribute('aria-label', 'Ingredient Name');

  // Original Amount Input
  const amountInput = document.createElement('input');
  amountInput.type = 'text';
  amountInput.inputMode = 'decimal';
  amountInput.className = 'form-control ing-amount-input';
  amountInput.placeholder = 'e.g. 1.5 or 1/2';
  amountInput.value = data.amount !== undefined ? data.amount : '';
  amountInput.setAttribute('aria-label', 'Original Amount');

  // Unit Dropdown
  const unitSelect = document.createElement('select');
  unitSelect.className = 'form-control ing-unit-input';
  unitSelect.setAttribute('aria-label', 'Unit of measurement');

  ALL_COMMON_UNITS.forEach(function (u) {
    const opt = document.createElement('option');
    opt.value = u;
    opt.textContent = u;
    if (data.unit && normalizeUnit(data.unit) === normalizeUnit(u)) {
      opt.selected = true;
    }
    unitSelect.appendChild(opt);
  });

  if (data.unit && !ALL_COMMON_UNITS.map(normalizeUnit).includes(normalizeUnit(data.unit))) {
    const customOpt = document.createElement('option');
    customOpt.value = data.unit;
    customOpt.textContent = data.unit;
    customOpt.selected = true;
    unitSelect.appendChild(customOpt);
  }

  // Row Delete Button
  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'row-action-btn';
  deleteBtn.title = 'Remove ingredient row';
  deleteBtn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  `;

  deleteBtn.addEventListener('click', function () {
    const allRows = ingredientsContainer.querySelectorAll('.ingredient-row');
    if (allRows.length > 1) {
      row.remove();
      renumberRows();
      saveToLocalStorage();
      tryLiveAutoScaling();
    } else {
      showToast('Recipe must have at least 1 ingredient row');
    }
  });

  amountInput.addEventListener('input', function () {
    const parsed = parseFractionOrDecimal(this.value);
    if (parsed > 0) {
      this.classList.remove('is-invalid');
    }
    saveToLocalStorage();
    tryLiveAutoScaling();
  });

  nameInput.addEventListener('input', function () {
    saveToLocalStorage();
    tryLiveAutoScaling();
  });

  unitSelect.addEventListener('change', function () {
    saveToLocalStorage();
    tryLiveAutoScaling();
  });

  row.appendChild(indexBadge);
  row.appendChild(nameInput);
  row.appendChild(amountInput);
  row.appendChild(unitSelect);
  row.appendChild(deleteBtn);

  ingredientsContainer.appendChild(row);
}

/**
 * Remove the last ingredient row
 */
function removeLastIngredientRow() {
  const rows = ingredientsContainer.querySelectorAll('.ingredient-row');
  if (rows.length > 1) {
    rows[rows.length - 1].remove();
    renumberRows();
    saveToLocalStorage();
    tryLiveAutoScaling();
  } else {
    showToast('Recipe must have at least 1 ingredient row');
  }
}

/**
 * Renumber row index badges
 */
function renumberRows() {
  const rows = ingredientsContainer.querySelectorAll('.ingredient-row');
  rows.forEach(function (row, idx) {
    const badge = row.querySelector('.row-index');
    if (badge) {
      badge.textContent = idx + 1;
    }
  });
}

/**
 * Update live ratio preview badge
 */
function updateLiveScalePreview() {
  const makes = parseFloat(servingsMakesInput.value);
  const wanted = parseFloat(servingsWantedInput.value);

  if (!isNaN(makes) && !isNaN(wanted) && makes > 0 && wanted > 0) {
    const factor = wanted / makes;
    ratioPreviewEl.style.display = 'flex';
    ratioValueEl.textContent = formatCleanNumber(factor) + '×';

    if (factor === 1) {
      ratioHintEl.textContent = '(Same yield)';
    } else if (factor === 2) {
      ratioHintEl.textContent = '(Doubled)';
    } else if (factor === 3) {
      ratioHintEl.textContent = '(Tripled)';
    } else if (factor === 0.5) {
      ratioHintEl.textContent = '(Halved)';
    } else if (factor > 1) {
      ratioHintEl.textContent = `(+${formatCleanNumber((factor - 1) * 100)}% increase)`;
    } else {
      ratioHintEl.textContent = `(-${formatCleanNumber((1 - factor) * 100)}% decrease)`;
    }
  } else {
    ratioPreviewEl.style.display = 'none';
  }
}

/**
 * CORE CALCULATION & ERROR HANDLING
 * Formula: New Amount = (Original Amount * Servings Wanted) / Servings Recipe Makes
 * Options: { scrollIntoView: boolean, isLive: boolean }
 */
function scaleRecipe(options = {}) {
  const makesStr = servingsMakesInput.value.trim();
  const wantedStr = servingsWantedInput.value.trim();

  const servingsMakes = parseFloat(makesStr);
  const servingsWanted = parseFloat(wantedStr);

  let hasValidationError = false;

  servingsMakesInput.classList.remove('is-invalid');
  servingsWantedInput.classList.remove('is-invalid');

  // Guard Clause for Servings
  if (makesStr === '' || isNaN(servingsMakes) || servingsMakes <= 0) {
    servingsMakesInput.classList.add('is-invalid');
    hasValidationError = true;
  }

  if (wantedStr === '' || isNaN(servingsWanted) || servingsWanted <= 0) {
    servingsWantedInput.classList.add('is-invalid');
    hasValidationError = true;
  }

  if (hasValidationError) {
    hideResults();
    currentScaledData = null;
    saveToLocalStorage();

    if (!options.isLive || (servingsMakes <= 0 && makesStr !== '') || (servingsWanted <= 0 && wantedStr !== '')) {
      showErrorBanner('Please enter valid serving numbers greater than 0.');
    }
    return;
  }

  // Parse ingredient rows
  const rows = ingredientsContainer.querySelectorAll('.ingredient-row');
  const ingredients = [];
  let hasValidPositiveIngredient = false;

  rows.forEach(function (row, idx) {
    const nameVal = row.querySelector('.ing-name-input').value.trim();
    const rawAmount = row.querySelector('.ing-amount-input').value.trim();
    const unit = row.querySelector('.ing-unit-input').value.trim();
    const amountInputEl = row.querySelector('.ing-amount-input');

    amountInputEl.classList.remove('is-invalid');

    const parsedAmount = parseFractionOrDecimal(rawAmount);

    if (nameVal === '' && rawAmount === '') {
      return;
    }

    const sanitizedName = sanitizeText(nameVal || `Ingredient #${idx + 1}`);

    ingredients.push({
      id: idx,
      name: sanitizedName,
      rawOriginalInput: rawAmount,
      originalAmount: parsedAmount,
      unit: sanitizeText(unit),
      element: amountInputEl
    });

    if (parsedAmount > 0) {
      hasValidPositiveIngredient = true;
    }
  });

  if (ingredients.length === 0 || !hasValidPositiveIngredient) {
    hideResults();
    currentScaledData = null;
    saveToLocalStorage();

    if (!options.isLive) {
      ingredients.forEach(function (ing) {
        if (ing.originalAmount <= 0) {
          ing.element.classList.add('is-invalid');
        }
      });
      showErrorBanner('Please enter at least one ingredient with an amount greater than 0.');
    }
    return;
  }

  hideErrorBanner();

  // Formula: New Amount = (Original Amount * Servings Wanted) / Servings Recipe Makes
  const factor = servingsWanted / servingsMakes;
  const scaledIngredients = ingredients.map(function (item, index) {
    const newAmount = (item.originalAmount * servingsWanted) / servingsMakes;

    const selectedUnit = ingredientUnitOverrides[index] || item.unit;
    let displayAmount = newAmount;

    if (selectedUnit !== item.unit) {
      const converted = convertUnit(newAmount, item.unit, selectedUnit);
      if (converted !== null) {
        displayAmount = converted;
      }
    }

    return {
      index: index,
      name: item.name,
      originalAmount: item.originalAmount,
      originalUnit: item.unit,
      baseScaledAmount: newAmount,
      displayAmount: displayAmount,
      displayUnit: selectedUnit
    };
  });

  const dishName = sanitizeText(dishNameInput.value.trim()) || 'Scaled Recipe';
  const tags = sanitizeText(recipeTagsInput.value.trim());

  currentScaledData = {
    dishName: dishName,
    tags: tags,
    servingsMakes: servingsMakes,
    servingsWanted: servingsWanted,
    factor: factor,
    ingredients: scaledIngredients,
    calculatedAt: new Date().toISOString()
  };

  renderResults(currentScaledData);
  saveToLocalStorage();

  if (options.scrollIntoView) {
    resultsCardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

/**
 * Render calculated results with clickable tag badges and unit conversion
 */
function renderResults(data) {
  if (!data) return;

  resultDishTitleEl.textContent = data.dishName;
  summaryOrigServingsEl.textContent = formatCleanNumber(data.servingsMakes);
  summaryTargetServingsEl.textContent = formatCleanNumber(data.servingsWanted);
  summaryFactorEl.textContent = formatCleanNumber(data.factor) + '×';

  // Render clickable recipe tag pill badges
  renderResultTags(data.tags || recipeTagsInput.value);

  resultsTableBodyEl.innerHTML = '';
  cookingChecklistEl.innerHTML = '';

  data.ingredients.forEach(function (item, idx) {
    const tr = document.createElement('tr');

    const origDisplay = formatNumberDisplay(item.originalAmount, numberFormat);
    const scaledDisplay = formatNumberDisplay(item.displayAmount, numberFormat);

    let changeTag = '';
    if (data.factor > 1) {
      changeTag = `<span class="change-tag change-up">▲ Scaled Up</span>`;
    } else if (data.factor < 1) {
      changeTag = `<span class="change-tag change-down">▼ Scaled Down</span>`;
    } else {
      changeTag = `<span class="change-tag change-same">= Same</span>`;
    }

    const compatibleUnits = getCompatibleUnits(item.originalUnit);
    let unitCellContent = '';

    if (compatibleUnits.length > 1) {
      let optionsHtml = '';
      compatibleUnits.forEach(function (u) {
        const isSelected = normalizeUnit(u) === normalizeUnit(item.displayUnit);
        optionsHtml += `<option value="${escapeHtml(u)}" ${isSelected ? 'selected' : ''}>${escapeHtml(u)}</option>`;
      });

      const isConverted = normalizeUnit(item.displayUnit) !== normalizeUnit(item.originalUnit);
      unitCellContent = `
        <div class="unit-convert-wrapper">
          <select class="unit-convert-select" data-row-index="${idx}" aria-label="Convert unit for ${escapeHtml(item.name)}">
            ${optionsHtml}
          </select>
          ${isConverted ? `<span class="unit-converted-indicator">converted from ${escapeHtml(item.originalUnit)}</span>` : ''}
        </div>
      `;
    } else {
      unitCellContent = `<span>${escapeHtml(item.displayUnit)}</span>`;
    }

    tr.innerHTML = `
      <td><strong>${escapeHtml(item.name)}</strong></td>
      <td>${origDisplay} ${escapeHtml(item.originalUnit)}</td>
      <td class="td-scaled"><span class="td-scaled-value">${scaledDisplay}</span></td>
      <td>${unitCellContent}</td>
      <td>${changeTag}</td>
    `;
    resultsTableBodyEl.appendChild(tr);

    const unitSelectEl = tr.querySelector('.unit-convert-select');
    if (unitSelectEl) {
      unitSelectEl.addEventListener('change', function () {
        const targetUnit = this.value;
        ingredientUnitOverrides[idx] = targetUnit;
        scaleRecipe({ isLive: true });
      });
    }

    // Cooking Checklist item
    const checkItem = document.createElement('label');
    checkItem.className = 'checklist-item';
    checkItem.innerHTML = `
      <input type="checkbox" class="checklist-checkbox" id="check-${idx}">
      <span><strong>${scaledDisplay} ${escapeHtml(item.displayUnit)}</strong> of ${escapeHtml(item.name)}</span>
    `;

    const checkbox = checkItem.querySelector('input');
    checkbox.addEventListener('change', function () {
      if (checkbox.checked) {
        checkItem.classList.add('checked');
      } else {
        checkItem.classList.remove('checked');
      }
    });

    cookingChecklistEl.appendChild(checkItem);
  });

  resultsCardEl.style.display = 'block';
  emptyStateCardEl.style.display = 'none';
}

/**
 * Hide results card and show empty state
 */
function hideResults() {
  resultsCardEl.style.display = 'none';
  emptyStateCardEl.style.display = 'block';
}

/**
 * Clean rounding to 2 decimal places if fractional
 */
function formatCleanNumber(num) {
  if (isNaN(num) || num === null || num === undefined) return '0';
  if (Number.isInteger(num)) {
    return num.toString();
  }
  return parseFloat(num.toFixed(2)).toString();
}

/**
 * Convert number to common culinary fraction string (e.g., 0.5 -> "½")
 */
function toFractionString(num) {
  const rounded = parseFloat(num.toFixed(2));
  const whole = Math.floor(rounded);
  const remainder = rounded - whole;

  if (remainder < 0.04) {
    return whole.toString();
  }

  const fractionMap = [
    { value: 0.125, str: '⅛' },
    { value: 0.2, str: '⅕' },
    { value: 0.25, str: '¼' },
    { value: 0.33, str: '⅓' },
    { value: 0.375, str: '⅜' },
    { value: 0.5, str: '½' },
    { value: 0.625, str: '⅝' },
    { value: 0.66, str: '⅔' },
    { value: 0.75, str: '¾' },
    { value: 0.875, str: '⅞' }
  ];

  let closest = fractionMap[0];
  let minDiff = Math.abs(remainder - fractionMap[0].value);

  for (let i = 1; i < fractionMap.length; i++) {
    const diff = Math.abs(remainder - fractionMap[i].value);
    if (diff < minDiff) {
      minDiff = diff;
      closest = fractionMap[i];
    }
  }

  if (minDiff < 0.065) {
    return whole > 0 ? `${whole} ${closest.str}` : closest.str;
  }

  return formatCleanNumber(num);
}

/**
 * Format numbers according to user mode: 'decimal', 'fraction', or 'both'
 */
function formatNumberDisplay(num, mode = 'decimal') {
  const decStr = formatCleanNumber(num);
  const fracStr = toFractionString(num);

  if (mode === 'fraction') {
    return fracStr;
  }

  if (mode === 'both') {
    if (decStr === fracStr) {
      return decStr;
    }
    return `${fracStr} <span class="dual-format-sub">(${decStr})</span>`;
  }

  return decStr;
}

/**
 * Show error banner with message
 */
function showErrorBanner(message) {
  errorMessageEl.textContent = message;
  errorBanner.style.display = 'flex';
}

/**
 * Hide error banner
 */
function hideErrorBanner() {
  errorBanner.style.display = 'none';
}

/**
 * RELOAD PERSISTENCE:
 * Simultaneously stores raw input field states and calculated results to localStorage
 */
function saveToLocalStorage() {
  try {
    const rows = ingredientsContainer.querySelectorAll('.ingredient-row');
    const ingredientList = [];

    rows.forEach(function (row) {
      ingredientList.push({
        name: row.querySelector('.ing-name-input').value,
        amount: row.querySelector('.ing-amount-input').value,
        unit: row.querySelector('.ing-unit-input').value
      });
    });

    const appState = {
      dishName: dishNameInput.value,
      tags: recipeTagsInput.value,
      servingsMakes: servingsMakesInput.value,
      servingsWanted: servingsWantedInput.value,
      ingredients: ingredientList,
      scaledResults: currentScaledData,
      ingredientUnitOverrides: ingredientUnitOverrides,
      activeSelectedTags: activeSelectedTags,
      numberFormat: numberFormat,
      updatedAt: Date.now()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (err) {
    console.warn('Failed to save to localStorage:', err);
  }
}

/**
 * RELOAD PERSISTENCE & SELF-HEALING:
 * If localStorage contains invalid or negative serving data, purges it on load
 * and resets cleanly to the default empty state with no errors.
 */
function restoreFromLocalStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return false;

    const data = JSON.parse(saved);

    const makes = parseFloat(data.servingsMakes);
    const wanted = parseFloat(data.servingsWanted);

    if (
      (data.servingsMakes !== '' && (isNaN(makes) || makes <= 0)) ||
      (data.servingsWanted !== '' && (isNaN(wanted) || wanted <= 0))
    ) {
      localStorage.removeItem(STORAGE_KEY);
      hideErrorBanner();
      hideResults();
      return false;
    }

    if (data.dishName !== undefined) {
      dishNameInput.value = data.dishName;
    }
    if (data.tags !== undefined) {
      recipeTagsInput.value = data.tags;
    }
    if (data.servingsMakes !== undefined) {
      servingsMakesInput.value = data.servingsMakes;
    }
    if (data.servingsWanted !== undefined) {
      servingsWantedInput.value = data.servingsWanted;
    }

    ingredientsContainer.innerHTML = '';
    if (Array.isArray(data.ingredients) && data.ingredients.length > 0) {
      data.ingredients.forEach(function (item) {
        addIngredientRow(item);
      });
    } else {
      createDefaultIngredientRows();
    }
    renumberRows();

    if (data.ingredientUnitOverrides) {
      ingredientUnitOverrides = data.ingredientUnitOverrides;
    }

    if (data.activeSelectedTags) {
      activeSelectedTags = data.activeSelectedTags;
    }

    if (data.numberFormat) {
      numberFormat = data.numberFormat;
      [fmtDecimalBtn, fmtFractionBtn, fmtBothBtn].forEach(btn => {
        if (btn) btn.classList.remove('active');
      });
      if (numberFormat === 'fraction' && fmtFractionBtn) {
        fmtFractionBtn.classList.add('active');
      } else if (numberFormat === 'both' && fmtBothBtn) {
        fmtBothBtn.classList.add('active');
      } else if (fmtDecimalBtn) {
        fmtDecimalBtn.classList.add('active');
      }
    }

    if (data.scaledResults && !isNaN(makes) && !isNaN(wanted) && makes > 0 && wanted > 0) {
      currentScaledData = data.scaledResults;
      renderResults(currentScaledData);
    } else {
      hideResults();
    }

    hideErrorBanner();
    return true;
  } catch (err) {
    console.warn('Failed to restore from localStorage, purging invalid state:', err);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    return false;
  }
}

/**
 * SEAMLESS FORM RESET with "Cleared" pop-up toast
 */
function executeFormReset() {
  dishNameInput.value = '';
  recipeTagsInput.value = '';
  servingsMakesInput.value = '';
  servingsWantedInput.value = '';

  servingsMakesInput.classList.remove('is-invalid');
  servingsWantedInput.classList.remove('is-invalid');

  ingredientUnitOverrides = {};
  activeSelectedTags = {};

  hideErrorBanner();
  hideResults();
  currentScaledData = null;

  createDefaultIngredientRows();
  updateLiveScalePreview();

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {}

  showToast('Cleared');
}

/**
 * Load a preset recipe
 */
function loadPreset(key) {
  const preset = PRESETS[key];
  if (!preset) return;

  dishNameInput.value = preset.dishName;
  recipeTagsInput.value = preset.tags || '';
  servingsMakesInput.value = preset.servingsMakes;
  servingsWantedInput.value = preset.servingsWanted;

  servingsMakesInput.classList.remove('is-invalid');
  servingsWantedInput.classList.remove('is-invalid');

  ingredientUnitOverrides = {};
  activeSelectedTags = {};

  ingredientsContainer.innerHTML = '';
  preset.ingredients.forEach(function (ing) {
    addIngredientRow(ing);
  });
  renumberRows();

  hideErrorBanner();
  updateLiveScalePreview();

  scaleRecipe({ scrollIntoView: true });
  showToast(`Loaded "${preset.dishName}"`);
}

/**
 * Standalone Quick Culinary Unit Converter tool
 */
function initQuickConverter() {
  function runQuickConvert() {
    const amt = parseFloat(quickConvertAmount.value);
    const from = quickConvertFrom.value;
    const to = quickConvertTo.value;

    if (isNaN(amt) || amt < 0) {
      quickConvertResult.textContent = '0';
      return;
    }

    const converted = convertUnit(amt, from, to);
    if (converted !== null) {
      quickConvertResult.textContent = formatCleanNumber(converted);
    } else {
      quickConvertResult.textContent = 'N/A';
    }
  }

  [quickConvertAmount, quickConvertFrom, quickConvertTo].forEach(function (el) {
    if (el) {
      el.addEventListener('input', runQuickConvert);
      el.addEventListener('change', runQuickConvert);
    }
  });

  runQuickConvert();
}

/**
 * Copy formatted recipe results to clipboard with visual confirmation
 */
function copyResultsToClipboard() {
  if (!currentScaledData) return;

  const lines = [];
  lines.push(`📝 ${currentScaledData.dishName}`);
  if (currentScaledData.tags) {
    lines.push(`🏷️ Tags: ${currentScaledData.tags}`);
  }
  lines.push(`Scaled yield: ${currentScaledData.servingsWanted} servings (from ${currentScaledData.servingsMakes} servings, ${formatCleanNumber(currentScaledData.factor)}×)`);
  lines.push('');
  lines.push('Ingredients:');

  currentScaledData.ingredients.forEach(function (item) {
    let amtDisplay = formatCleanNumber(item.displayAmount);
    if (numberFormat === 'fraction') {
      amtDisplay = toFractionString(item.displayAmount);
    } else if (numberFormat === 'both') {
      const frac = toFractionString(item.displayAmount);
      const dec = formatCleanNumber(item.displayAmount);
      amtDisplay = frac !== dec ? `${frac} (${dec})` : dec;
    }
    lines.push(`• ${amtDisplay} ${item.displayUnit} ${item.name}`);
  });

  const fullText = lines.join('\n');

  function indicateSuccess() {
    if (copyBtnText) {
      copyBtnText.textContent = 'Copied! ✓';
    }
    if (copyResultsBtn) {
      copyResultsBtn.classList.add('btn-copied-success');
    }
    showToast('Copied to clipboard!');

    setTimeout(function () {
      if (copyBtnText) {
        copyBtnText.textContent = 'Copy Scaled Recipe';
      }
      if (copyResultsBtn) {
        copyResultsBtn.classList.remove('btn-copied-success');
      }
    }, 2200);
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(fullText)
      .then(indicateSuccess)
      .catch(function () {
        fallbackCopyText(fullText, indicateSuccess);
      });
  } else {
    fallbackCopyText(fullText, indicateSuccess);
  }
}

/**
 * Fallback copy function
 */
function fallbackCopyText(text, onSuccess) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    if (onSuccess) onSuccess();
  } catch (err) {
    showToast('Failed to copy text.');
  }
  document.body.removeChild(textArea);
}

/**
 * Show temporary toast pop-up notification
 */
let toastTimeout;
function showToast(msg) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.style.display = 'block';

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(function () {
    toastEl.style.display = 'none';
  }, 2200);
}

/**
 * Text sanitization helper
 */
function sanitizeText(str) {
  if (str === null || str === undefined) return '';
  return String(str).trim();
}

/**
 * HTML Escaper
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Bootstrap execution
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
