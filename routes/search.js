const router = require('express').Router();
const queries = require('../db/queries');
const options = require('../config/options');
const { MAX_QUERY_LENGTH, parseSearchFilters, describeFilters } = require('../lib/search-filters');

// Results page for the header search bar, the filters, and the category links.
// TODO(Seth, Phase 2): real database results and sorting.
router.get('/search', async (req, res) => {
  const filters = parseSearchFilters(req.query);
  const recipes = await queries.searchRecipes(filters, req.query.sort);
  res.render('results', {
    title: filters.q ? `Results for "${filters.q}"` : 'Search results',
    recipes,
    options,
    query: filters,
    activeFilters: describeFilters(filters),
  });
});

// public/js/search.js calls this after 2+ typed characters.
router.get('/api/suggest', async (req, res) => {
  const term = String(req.query.q || '').trim().slice(0, MAX_QUERY_LENGTH);
  res.json(term.length < 2 ? [] : await queries.getSuggestions(term));
});

module.exports = router;
