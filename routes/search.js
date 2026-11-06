const router = require('express').Router();
const queries = require('../db/queries');
const options = require('../config/options');

// TODO(Seth, Phase 1): results page, working with Dwayne's filters.
// TODO(Seth, Phase 2): real database results and sorting.
router.get('/search', async (req, res) => {
  const recipes = await queries.searchRecipes(req.query, req.query.sort);
  res.render('results', { title: 'Search results', recipes, options, query: req.query });
});

// TODO(Seth, Phase 1): public/js/search.js calls this after 2+ typed characters.
router.get('/api/suggest', async (req, res) => {
  const term = String(req.query.q || '').trim();
  res.json(term.length < 2 ? [] : await queries.getSuggestions(term));
});

module.exports = router;
