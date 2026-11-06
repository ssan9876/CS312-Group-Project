const router = require('express').Router();
const notBuilt = require('./not-built');

// TODO(Dwayne, Phase 1): page layouts in views/login.ejs and views/signup.ejs.
router.get('/login', (req, res) => res.render('login', { title: 'Log in' }));
router.get('/signup', (req, res) => res.render('signup', { title: 'Sign up' }));

// TODO(Seth, Phase 2): hash passwords, create sessions, and validate input.
// TODO(Nick, Phase 2): add the login SQL to db/queries.js.
router.post('/login', notBuilt('Logging in is planned for Phase 2.'));
router.post('/signup', notBuilt('Signing up is planned for Phase 2.'));
router.post('/logout', notBuilt('Logging out is planned for Phase 2.'));

module.exports = router;
