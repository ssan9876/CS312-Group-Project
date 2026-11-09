// Every database call for the site lives here, so routes and pages never contain SQL.
//
// TODO(Nick): replace each function's sample data with SQL. Keep the returned
// field names the same (or update the pages too) so nothing else has to change.
//
// Always pass user input as parameters ($1, $2), never by building SQL strings:
//   const pool = require('./pool');
//   const { rows } = await pool.query('SELECT * FROM recipes WHERE id = $1', [id]);
//   return rows[0];
const sample = require('./sample-data');
const { recipeMatches, suggestFromRecipes } = require('../lib/search-filters');

// `filters` comes from parseSearchFilters() in lib/search-filters.js. Its keys
// match the form fields in views/partials/filters.ejs: q, cuisine, dietary,
// mealType, cookTime, difficulty, minRating. Every value is already checked
// against config/options.js; empty string or null means "any".
// Use cookTimeRange(filters.cookTime) for the min/max minutes.
//
// Phase 1 filters the sample data in memory so the results page works now.
// TODO(Nick, Phase 1): cook time, difficulty, rating, and category queries.
// TODO(Seth, Phase 2): apply `filters` and `sort` in SQL.
async function searchRecipes(filters = {}, sort = 'newest') {
  return sample.recipes.filter((recipe) => recipeMatches(recipe, filters));
}

// Returns up to 8 { text, type } objects, where type is 'Recipe' or 'Ingredient'.
// public/js/search.js shows them in the header search dropdown.
// Phase 1 searches the sample data; switch to SQL with the other queries.
async function getSuggestions(term) {
  return suggestFromRecipes(sample.recipes, term);
}

async function getFeaturedRecipes() {
  return sample.recipes.slice(0, 4);
}

async function getRecipeById(id) {
  return sample.recipes.find((recipe) => recipe.id === id);
}

async function getRecipeComments(recipeId) {
  return sample.comments.filter((comment) => comment.recipeId === recipeId);
}

// TODO(Nick, Phase 2): profile queries.
async function getUserByUsername(username) {
  return sample.users.find((user) => user.username === username);
}

async function getUserRecipes(username) {
  return sample.recipes.filter((recipe) => recipe.username === username);
}

async function getUserComments(username) {
  return sample.comments.filter((comment) => comment.username === username);
}

module.exports = {
  searchRecipes,
  getSuggestions,
  getFeaturedRecipes,
  getRecipeById,
  getRecipeComments,
  getUserByUsername,
  getUserRecipes,
  getUserComments,
};
