const router = require('express').Router();
const queries = require('../db/queries');

// TODO(Dwayne, Phase 2): page layout in views/profile.ejs.
// Live data from PostgreSQL: the user, their recipes, their comments, the
// ratings their recipes have received, and (on your own profile) your collections.
router.get('/:username', async (req, res, next) => {
  const profile = await queries.getUserByUsername(req.params.username);
  if (!profile) return next();

  // Saved recipes are private, so collections only load on your own profile.
  const isOwnProfile = req.session.user?.id === profile.id;

  const [recipes, comments, ratingsReceived, collections] = await Promise.all([
    queries.getUserRecipes(profile.username),
    queries.getUserComments(profile.username),
    queries.getUserRatingsReceived(profile.username),
    isOwnProfile ? queries.getUserCollections(profile.username) : [],
  ]);
  res.render('profile', {
    title: profile.username,
    profile,
    recipes,
    comments,
    ratingsReceived,
    collections,
    isOwnProfile,
  });
});

module.exports = router;
