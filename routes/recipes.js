const router = require('express').Router();
const queries = require('../db/queries');
const options = require('../config/options');
const notBuilt = require('./not-built');

// TODO(unassigned): recipe submission form. This must stay above /:id.
router.get('/new', (req, res) => {
  res.render('recipe-form', { title: 'Submit a recipe', options });
});
router.post('/', notBuilt('The recipe submission form does not have an owner yet.'));

// TODO(unassigned): recipe page layout in views/recipe.ejs.
router.get('/:id', async (req, res, next) => {
  if (!/^\d+$/.test(req.params.id)) return next();

  const id = Number(req.params.id);
  const recipe = await queries.getRecipeById(id);
  if (!recipe) return next();

  const comments = await queries.getRecipeComments(id);
  res.render('recipe', { title: recipe.title, recipe, comments });
});

// TODO(Dwayne, Phase 2): ratings, comments, and replies.
router.post('/:id/ratings', notBuilt('Ratings are planned for Phase 2.'));
router.post('/:id/comments', notBuilt('Comments and replies are planned for Phase 2.'));

// TODO(unassigned): saved recipes and collections.
router.post('/:id/save', notBuilt('Saving recipes does not have an owner yet.'));

module.exports = router;
