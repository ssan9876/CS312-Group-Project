const router = require('express').Router();
const queries = require('../db/queries');
const { MEAL_TYPES, CUISINES, DIETARY_TAGS } = require('../config/options');

// TODO(Dwayne, Phase 1): homepage layout in views/home.ejs.
router.get('/', async (req, res) => {
  const recipes = await queries.getFeaturedRecipes();
  res.render('home', { title: 'Home', recipes });
});

// Category page: each link opens /search with that category filter set.
router.get('/categories', (req, res) => {
  res.render('categories', {
    title: 'Categories',
    mealTypes: MEAL_TYPES,
    cuisines: CUISINES,
    dietaryTags: DIETARY_TAGS,
  });
});

module.exports = router;
