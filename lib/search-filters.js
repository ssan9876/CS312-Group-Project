// Search and filter helpers for the results page and the autocomplete dropdown.
//
// parseSearchFilters() turns the query string into clean values. Anything not in
// config/options.js is dropped, so the SQL in db/queries.js can trust these values.
// recipeMatches() and suggestFromRecipes() work on the sample data in Phase 1.
// They go away once db/queries.js uses SQL.
const options = require('../config/options');

const MAX_QUERY_LENGTH = 100;
const MAX_SUGGESTIONS = 8;

// Express turns ?a=1&a=2 into an array; keep only the first value.
function single(value) {
  const first = Array.isArray(value) ? value[0] : value;
  return typeof first === 'string' ? first.trim() : '';
}

// Returns the allowed value with its usual capitalization, or '' if not allowed.
function oneOf(value, allowed) {
  const wanted = single(value).toLowerCase();
  return allowed.find((item) => item.toLowerCase() === wanted) || '';
}

function parseSearchFilters(query = {}) {
  const minRating = Number(single(query.minRating));
  return {
    q: single(query.q).slice(0, MAX_QUERY_LENGTH),
    cuisine: oneOf(query.cuisine, options.CUISINES),
    dietary: oneOf(query.dietary, options.DIETARY_TAGS),
    mealType: oneOf(query.mealType, options.MEAL_TYPES),
    cookTime: oneOf(query.cookTime, options.COOK_TIME_RANGES.map((range) => range.value)),
    difficulty: oneOf(query.difficulty, options.DIFFICULTIES),
    minRating: Number.isInteger(minRating) && minRating >= 1 && minRating <= 5 ? minRating : null,
  };
}

function cookTimeRange(value) {
  return options.COOK_TIME_RANGES.find((range) => range.value === value) || null;
}

// The active filters as label/value pairs, for the summary above the results.
function describeFilters(filters) {
  const active = [];
  if (filters.cuisine) active.push({ label: 'Cuisine', value: filters.cuisine });
  if (filters.dietary) active.push({ label: 'Dietary', value: filters.dietary });
  if (filters.mealType) active.push({ label: 'Meal type', value: filters.mealType });
  if (filters.cookTime) active.push({ label: 'Cook time', value: cookTimeRange(filters.cookTime).label });
  if (filters.difficulty) active.push({ label: 'Difficulty', value: filters.difficulty });
  if (filters.minRating) active.push({ label: 'Rating', value: `${filters.minRating}+ stars` });
  return active;
}

function searchWords(q) {
  return q.toLowerCase().split(/\s+/).filter(Boolean);
}

// True when `word` starts a word somewhere in `text`: "egg" matches "eggs" but
// not "veggie". (In PostgreSQL, `~* ('\m' || word)` does the same.)
function startsAWord(text, word) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaped}`, 'iu').test(text);
}

// Every search word must start a word in the title, cuisine, meal type, a
// dietary tag, or an ingredient, so "chicken" finds every recipe with chicken.
function recipeMatches(recipe, filters) {
  const text = [recipe.title, recipe.cuisine, recipe.mealType, ...recipe.dietaryTags, ...recipe.ingredients].join(' ');
  if (!searchWords(filters.q).every((word) => startsAWord(text, word))) return false;

  if (filters.cuisine && recipe.cuisine !== filters.cuisine) return false;
  if (filters.dietary && !recipe.dietaryTags.includes(filters.dietary)) return false;
  if (filters.mealType && recipe.mealType !== filters.mealType) return false;
  if (filters.difficulty && recipe.difficulty !== filters.difficulty) return false;

  const range = cookTimeRange(filters.cookTime);
  if (range) {
    if (recipe.cookTimeMinutes < range.min) return false;
    if (range.max !== null && recipe.cookTimeMinutes >= range.max) return false;
  }

  // Unrated recipes never pass a minimum rating.
  if (filters.minRating && !(recipe.reviewCount > 0 && recipe.averageRating >= filters.minRating)) return false;

  return true;
}

// "1 lb chicken" -> "chicken", so the dropdown suggests the ingredient, not the amount.
const UNITS = 'cups?|tbsps?|tablespoons?|tsps?|teaspoons?|lbs?|pounds?|oz|ounces?|g|grams?|kg|ml|l|liters?|cloves?|cans?|pinch(?:es)?|dash(?:es)?|slices?|pieces?';
const LEADING_AMOUNT = new RegExp(`^[\\d\\s./½¼¾⅓⅔-]+(?:(?:${UNITS})\\.?\\s+)?(?:of\\s+)?`, 'i');

function ingredientName(text) {
  const name = text.replace(LEADING_AMOUNT, '').trim();
  return name || text.trim();
}

// Text that starts with what was typed comes first, then alphabetical order.
function bySuggestionRank(term) {
  const rank = (text) => (text.toLowerCase().startsWith(term) ? 0 : 1);
  return (a, b) => rank(a.text) - rank(b.text) || a.text.localeCompare(b.text);
}

// Recipe titles first, then ingredients, with no repeats.
function suggestFromRecipes(recipes, term) {
  const needle = term.toLowerCase();
  const titles = new Map();
  const ingredients = new Map();

  recipes.forEach((recipe) => {
    if (startsAWord(recipe.title, needle)) {
      titles.set(recipe.title.toLowerCase(), { text: recipe.title, type: 'Recipe' });
    }
    recipe.ingredients.forEach((ingredient) => {
      const name = ingredientName(ingredient);
      if (startsAWord(name, needle) && !ingredients.has(name.toLowerCase())) {
        ingredients.set(name.toLowerCase(), { text: name, type: 'Ingredient' });
      }
    });
  });

  const sort = bySuggestionRank(needle);
  return [...[...titles.values()].sort(sort), ...[...ingredients.values()].sort(sort)].slice(0, MAX_SUGGESTIONS);
}

module.exports = {
  MAX_QUERY_LENGTH,
  parseSearchFilters,
  describeFilters,
  cookTimeRange,
  recipeMatches,
  ingredientName,
  suggestFromRecipes,
};
