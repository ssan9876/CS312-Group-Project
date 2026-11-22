require('dotenv').config();

const path = require('path');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const pool = require('./db/pool');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// Without SESSION_SECRET, a random secret still works, but everyone is logged
// out each time the server restarts. Set it in .env (see .env.example).
let sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  if (isProduction) throw new Error('SESSION_SECRET must be set in production.');
  console.warn('SESSION_SECRET is not set; using a random one. Logins will not survive a restart.');
  sessionSecret = crypto.randomBytes(32).toString('hex');
}
if (isProduction) app.set('trust proxy', 1);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));

// Sessions are stored in the "session" table, which is created on first use, so
// logins survive a server restart. Logging in sets req.session.user to
// { id, username } (routes/auth.js); every page sees it as currentUser.
app.use(session({
  store: new PgSession({ pool, createTableIfMissing: true }),
  name: 'recipes.sid',
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false, // no cookie until someone logs in
  cookie: {
    httpOnly: true, // page scripts cannot read the cookie
    sameSite: 'lax', // other sites cannot send forms with it
    secure: isProduction, // HTTPS only when deployed
    maxAge: 7 * 24 * 60 * 60 * 1000, // one week
  },
}));

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.searchTerm = req.query.q || '';
  next();
});

app.use(require('./routes/pages'));
app.use(require('./routes/search'));
app.use(require('./routes/auth'));
app.use('/recipes', require('./routes/recipes'));
app.use('/profile', require('./routes/profile'));

app.use((req, res) => {
  res.status(404).render('error', { title: 'Page not found', message: 'We could not find that page.' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', { title: 'Something went wrong', message: 'Please try again.' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Running at http://localhost:${port}`);
});
