const router = require('express').Router();
const queries = require('../db/queries');
const options = require('../config/options');
const notBuilt = require('./not-built');
const { requireLogin} = require('../lib/auth');

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
router.post('/:id/comments', requireLogin, async (req, res, next) => {
  try {
    // Making sure that the recipe is valid
    if (!/^\d+$/.test(req.params.id)) return next();

    const recipeId = Number(req.params.id);

    // Making sure the recipe exists on the database
    const recipe = await queries.getRecipeById(recipeId);
    if (!recipe) return next();

    // Get the comment and remove the whitespace if any
    const body = typeof req.body.body === 'string'
      ? req.body.body.trim()
      : '';

    // Limits the comment to make sure it's not empty and doesn't exceed maximum 1000
    if (!body || body.length > 1000) {
      return res.redirect(`/recipes/${recipeId}`);
    }

    //Differentating the comments and replys with empty parentcommendid and oen with a number for reply
    let parentCommentId = null;

    if (req.body.parentCommentId) {
      if (!/^\d+$/.test(req.body.parentCommentId)) {
        return res.redirect(`/recipes/${recipeId}`);
      }

      parentCommentId = Number(req.body.parentCommentId);
    }

    // Have the comment saved on the user logged in
    const comment = await queries.createRecipeComment({
      recipeId,
      userId: req.session.user.id,
      parentCommentId,
      body,
    });

    // check if the comment exists for the reply to exists to
    if (!comment) {
      return res.redirect(`/recipes/${recipeId}`);
    }

    // This returns to the recipe and show comment
    res.redirect(`/recipes/${recipeId}#comment-${comment.id}`);
  } catch (error) {
    next(error);
  }
});

// TODO(unassigned): saved recipes and collections.
router.post('/:id/save', notBuilt('Saving recipes does not have an owner yet.'));

module.exports = router;
