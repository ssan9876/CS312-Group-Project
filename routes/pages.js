const router = require('express').Router();
const queries = require('../db/queries');
const { MEAL_TYPES, CUISINES } = require('../config/options');

// TODO(Dwayne, Phase 1): homepage layout in views/home.ejs.
router.get('/', async (req, res) => {
  const recipes = await queries.getFeaturedRecipes();
  res.render('home', { title: 'Home', recipes });
});

// TODO(Seth, Phase 1): category page in views/categories.ejs.
router.get('/categories', (req, res) => {
  res.render('categories', { title: 'Categories', mealTypes: MEAL_TYPES, cuisines: CUISINES });
});

module.exports = router;
