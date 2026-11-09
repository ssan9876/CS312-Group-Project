require('dotenv').config();

const path = require('path');
const express = require('express');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));

// TODO(Seth, Phase 2): add sessions here and set currentUser from the session.
app.use((req, res, next) => {
  res.locals.currentUser = null;
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
