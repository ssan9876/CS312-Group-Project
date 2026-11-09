const router = require('express').Router();
const queries = require('../db/queries');

// TODO(Dwayne, Phase 2): page layout in views/profile.ejs.
// TODO(Seth, Phase 2): fill in live data, including ratings received and collections.
router.get('/:username', async (req, res, next) => {
  const profile = await queries.getUserByUsername(req.params.username);
  if (!profile) return next();

  const [recipes, comments] = await Promise.all([
    queries.getUserRecipes(profile.username),
    queries.getUserComments(profile.username),
  ]);
  res.render('profile', { title: profile.username, profile, recipes, comments });
});

module.exports = router;
