const router = require('express').Router();
const bcrypt = require('bcryptjs');
const queries = require('../db/queries');
const { safeReturnTo } = require('../lib/auth');

// bcrypt cost: each step doubles the work. 12 takes a fraction of a second per
// login, which is fine for people and slow for anyone guessing passwords.
const HASH_ROUNDS = 12;
// bcrypt ignores everything after 72 bytes, so longer passwords are rejected.
const MAX_PASSWORD_BYTES = 72;
const MIN_PASSWORD_LENGTH = 8;
const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,30}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 50;

// Compared against when the username does not exist, so a wrong username takes
// as long as a wrong password and the timing does not reveal which accounts exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', HASH_ROUNDS);

// A form field as a string. A repeated field (?a=1&a=2) arrives as an array; keep the first.
function field(body, name) {
  const value = Array.isArray(body[name]) ? body[name][0] : body[name];
  return typeof value === 'string' ? value : '';
}

// Returns { values, errors }. `values` is what gets saved (and refills the form),
// and `errors` is a list of messages for the form; empty means valid.
function validateSignup(body) {
  const values = {
    email: field(body, 'email').trim().toLowerCase(),
    username: field(body, 'username').trim(),
    firstName: field(body, 'firstName').trim(),
    lastName: field(body, 'lastName').trim(),
  };
  const password = field(body, 'password');
  const errors = [];

  if (!EMAIL_PATTERN.test(values.email) || values.email.length > 254) {
    errors.push('Enter a valid email address.');
  }
  if (!USERNAME_PATTERN.test(values.username)) {
    errors.push('Username must be 3-30 characters: letters, numbers, and underscores only.');
  }
  if (!values.firstName || values.firstName.length > MAX_NAME_LENGTH) {
    errors.push(`First name is required (up to ${MAX_NAME_LENGTH} characters).`);
  }
  if (!values.lastName || values.lastName.length > MAX_NAME_LENGTH) {
    errors.push(`Last name is required (up to ${MAX_NAME_LENGTH} characters).`);
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  } else if (Buffer.byteLength(password) > MAX_PASSWORD_BYTES) {
    errors.push(`Password must be at most ${MAX_PASSWORD_BYTES} characters.`);
  }
  if (password !== field(body, 'confirmPassword')) {
    errors.push('Passwords do not match.');
  }
  return { values, password, errors };
}

// Starts a fresh session for the user. Regenerating gives them a new session ID,
// so an ID someone planted before login is useless afterwards.
function logIn(req, user) {
  const returnTo = req.session.returnTo;
  return new Promise((resolve, reject) => {
    req.session.regenerate((regenerateError) => {
      if (regenerateError) return reject(regenerateError);
      req.session.user = { id: user.id, username: user.username };
      req.session.save((saveError) => (saveError ? reject(saveError) : resolve(safeReturnTo(returnTo))));
    });
  });
}

// TODO(Dwayne, Phase 1): page layouts in views/login.ejs and views/signup.ejs.
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('login', { title: 'Log in' });
});

router.get('/signup', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('signup', { title: 'Sign up' });
});

router.post('/signup', async (req, res) => {
  const { values, password, errors } = validateSignup(req.body);
  const showForm = (messages) => res.status(400).render('signup', { title: 'Sign up', errors: messages, values });
  if (errors.length) return showForm(errors);

  let user;
  try {
    const passwordHash = await bcrypt.hash(password, HASH_ROUNDS);
    user = await queries.createUser({ ...values, passwordHash });
  } catch (error) {
    // 23505 is PostgreSQL's code for breaking a UNIQUE rule.
    if (error.code === '23505') {
      const taken = error.constraint === 'users_email_key' ? 'An account with that email already exists.' : 'That username is taken.';
      return showForm([taken]);
    }
    throw error;
  }

  res.redirect(await logIn(req, user));
});

router.post('/login', async (req, res) => {
  const username = field(req.body, 'username').trim();
  const password = field(req.body, 'password');

  const user = username && password ? await queries.getUserForLogin(username) : null;
  // Always run one compare, even for an unknown user (see DUMMY_HASH).
  const passwordMatches = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);

  if (!user || !passwordMatches) {
    // One message for both cases, so the form does not reveal which usernames exist.
    return res.status(401).render('login', {
      title: 'Log in',
      errors: ['Incorrect username or password.'],
      values: { username },
    });
  }

  res.redirect(await logIn(req, user));
});

router.post('/logout', (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie('recipes.sid');
    res.redirect('/');
  });
});

module.exports = router;
