// Every database call for the site lives here, so routes and pages never contain SQL.
//
// TODO(Nick): replace each function's sample data with SQL. Keep the returned
// field names the same (or update the pages too) so nothing else has to change.
//
// Always pass user input as parameters ($1, $2), never by building SQL strings:
//   const { rows } = await pool.query('SELECT * FROM recipes WHERE id = $1', [id]);
//   return rows[0];
const pool = require('./pool');
const sample = require('./sample-data');
const { suggestFromRecipes, cookTimeRange, searchWords } = require('../lib/search-filters');

// Columns for a recipe card or recipe page, renamed to the camelCase fields the
// pages use. Needs `recipes r`, `users u`, and the `rs` ratings join below.
// AVG and COUNT come back from pg as strings, so they are cast to numbers.
const RECIPE_COLUMNS = `
  r.id,
  r.user_id AS "userID",
  u.username,
  r.title,
  r.cuisine,
  r.meal_type AS "mealType",
  r.dietary_tags AS "dietaryTags",
  r.cook_time_minutes AS "cookTimeMinutes",
  r.difficulty,
  r.photo_url AS "photoUrl",
  r.ingredients,
  r.instructions,
  r.created_at AS "createdAt",
  COALESCE(rs.average_rating, 0)::float8 AS "averageRating",
  COALESCE(rs.review_count, 0)::int AS "reviewCount"`;

const RECIPE_FROM = `
  FROM recipes r
  JOIN users u ON u.id = r.user_id
  LEFT JOIN (
    SELECT recipe_id, AVG(stars) AS average_rating, COUNT(*) AS review_count
    FROM ratings
    GROUP BY recipe_id
  ) rs ON rs.recipe_id = r.id`;

// The ORDER BY for each value in SORT_OPTIONS (config/options.js). Only these
// fixed strings ever reach the SQL, never the raw ?sort= value. r.id breaks ties
// so the order is the same on every page load.
const SORT_SQL = {
  newest: 'r.created_at DESC, r.id DESC',
  rating: '"averageRating" DESC, "reviewCount" DESC, r.id DESC',
  quickest: 'r.cook_time_minutes ASC, r.id DESC',
  title: 'r.title ASC, r.id ASC',
};

// Every text field a search word can match: the same fields recipeMatches() used.
const SEARCH_TEXT = `concat_ws(' ', r.title, r.cuisine, r.meal_type,
  array_to_string(r.dietary_tags, ' '), array_to_string(r.ingredients, ' '))`;

// Escapes regex characters so a search for "1/2 cup (milk)" matches literally.
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// `filters` comes from parseSearchFilters() in lib/search-filters.js. Its keys
// match the form fields in views/partials/filters.ejs: q, cuisine, dietary,
// mealType, cookTime, difficulty, minRating. Every value is already checked
// against config/options.js; empty string or null means "any".
// `sort` comes from parseSort(); anything unknown sorts by newest.
async function searchRecipes(filters = {}, sort = 'newest') {
  const conditions = [];
  const params = [];
  // Adds a value to params and returns its placeholder, like $3.
  const param = (value) => {
    params.push(value);
    return `$${params.length}`;
  };

  // Every search word has to start a word somewhere in the recipe, so "egg"
  // matches "2 eggs" but not "veggie". (^|[^[:alnum:]]) marks a word start.
  searchWords(filters.q || '').forEach((word) => {
    conditions.push(`${SEARCH_TEXT} ~* ${param(`(^|[^[:alnum:]])${escapeRegex(word)}`)}`);
  });

  if (filters.cuisine) conditions.push(`r.cuisine = ${param(filters.cuisine)}`);
  if (filters.dietary) conditions.push(`${param(filters.dietary)} = ANY(r.dietary_tags)`);
  if (filters.mealType) conditions.push(`r.meal_type = ${param(filters.mealType)}`);
  if (filters.difficulty) conditions.push(`r.difficulty = ${param(filters.difficulty)}`);

  // min is inclusive and max is exclusive (see COOK_TIME_RANGES).
  const range = cookTimeRange(filters.cookTime);
  if (range) {
    conditions.push(`r.cook_time_minutes >= ${param(range.min)}`);
    if (range.max !== null) conditions.push(`r.cook_time_minutes < ${param(range.max)}`);
  }

  // Unrated recipes never pass a minimum rating.
  if (filters.minRating) conditions.push(`rs.average_rating >= ${param(filters.minRating)}`);

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderBy = SORT_SQL[sort] || SORT_SQL.newest;
  const { rows } = await pool.query(`SELECT ${RECIPE_COLUMNS} ${RECIPE_FROM} ${where} ORDER BY ${orderBy}`, params);
  return rows;
}

// Returns up to 8 { text, type } objects, where type is 'Recipe' or 'Ingredient'.
// public/js/search.js shows them in the header search dropdown.
// Phase 1 searches the sample data; switch to SQL with the other queries.
async function getSuggestions(term) {
  return suggestFromRecipes(sample.recipes, term);
}

async function getFeaturedRecipes() {
  const { rows } = await pool.query(
    `SELECT ${RECIPE_COLUMNS}
    ${RECIPE_FROM}
    ORDER BY r.created_at DESC, r.id DESC
    LIMIT 4`
  );
  return rows;
}

// Gets the recipe from the sql
async function getRecipeById(id) {
  const { rows } = await pool.query(
    `SELECT ${RECIPE_COLUMNS}
     ${RECIPE_FROM}
     WHERE r.id = $1`,
    [id],
  );

  return rows[0];
}

// This shows all the comments on the recipe card from oldest to first
async function getRecipeComments(recipeId) {
  const { rows } = await pool.query(
    `SELECT
       c.id,
       c.recipe_id AS "recipeId",
       c.parent_comment_id AS "parentCommentId",
       c.body,
       c.created_at AS "createdAt",
       u.username
     FROM comments c
     JOIN users u ON u.id = c.user_id
     WHERE c.recipe_id = $1
     ORDER BY c.created_at ASC, c.id ASC`,
    [recipeId],
  );

  return rows;
}

//Checking if the user rated the recipe and update the rating if rating agin
async function submitRating({ recipeId, userId, stars }) {
  const { rows } = await pool.query(
    `INSERT INTO ratings (recipe_id, user_id, stars)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, recipe_id)
     DO UPDATE SET
       stars = EXCLUDED.stars,
       created_at = now()
     RETURNING stars`,
    [recipeId, userId, stars],
  );

  return rows[0];
}

//get the ratings from the database for the recipe
async function getUserRecipeRating(recipeId, userId) {
  const { rows } = await pool.query(
    `SELECT stars
     FROM ratings
     WHERE recipe_id = $1 AND user_id = $2`,
    [recipeId, userId],
  );

  return rows[0]?.stars ?? null;
}

// This saves the comments to the SQl
async function createRecipeComment({
  recipeId,
  userId,
  parentCommentId,
  body
}) {
  const { rows } = await pool.query(
    `INSERT INTO comments (recipe_id, user_id, parent_comment_id, body)
     SELECT $1, $2, $3, $4
     WHERE $3::integer IS NULL
        OR EXISTS (
          SELECT 1
          FROM comments
          WHERE id = $3
            AND recipe_id = $1
        )
     RETURNING id`,
    [recipeId, userId, parentCommentId, body],
  );

  return rows[0];
}

// ---- Accounts (used by routes/auth.js) ----

// Returns the new user's { id, username }. A duplicate username or email throws
// a pg error with code '23505'; routes/auth.js turns that into a form message.
async function createUser({ username, email, passwordHash, firstName, lastName }) {
  const { rows } = await pool.query(
    `INSERT INTO users (username, email, password_hash, first_name, last_name)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, username`,
    [username, email, passwordHash, firstName, lastName],
  );
  return rows[0];
}

// Only login uses this, because it is the one place that needs the hash.
async function getUserForLogin(username) {
  const { rows } = await pool.query(
    'SELECT id, username, password_hash AS "passwordHash" FROM users WHERE username = $1',
    [username],
  );
  return rows[0];
}

// ---- Profile page (used by routes/profile.js) ----

async function getUserByUsername(username) {
  const { rows } = await pool.query(
    `SELECT id, username, first_name AS "firstName", last_name AS "lastName", bio, created_at AS "createdAt"
     FROM users
     WHERE username = $1`,
    [username],
  );
  return rows[0];
}

async function getUserRecipes(username) {
  const { rows } = await pool.query(
    `SELECT ${RECIPE_COLUMNS} ${RECIPE_FROM} WHERE u.username = $1 ORDER BY r.created_at DESC, r.id DESC`,
    [username],
  );
  return rows;
}

// Comments and replies the user wrote, newest first, with the recipe they are on.
async function getUserComments(username) {
  const { rows } = await pool.query(
    `SELECT c.id, c.recipe_id AS "recipeId", r.title AS "recipeTitle", u.username,
            c.parent_comment_id AS "parentCommentId", c.body, c.created_at AS "createdAt"
     FROM comments c
     JOIN users u ON u.id = c.user_id
     JOIN recipes r ON r.id = c.recipe_id
     WHERE u.username = $1
     ORDER BY c.created_at DESC, c.id DESC`,
    [username],
  );
  return rows;
}

// Every rating on every recipe the user posted: { average, count }.
async function getUserRatingsReceived(username) {
  const { rows } = await pool.query(
    `SELECT COALESCE(AVG(rat.stars), 0)::float8 AS average, COUNT(rat.stars)::int AS count
     FROM ratings rat
     JOIN recipes r ON r.id = rat.recipe_id
     JOIN users u ON u.id = r.user_id
     WHERE u.username = $1`,
    [username],
  );
  return rows[0];
}

// The user's saved recipes grouped by collection name:
// [{ name: 'Favorites', recipes: [recipe, ...] }, ...], collections in A-Z order.
async function getUserCollections(username) {
  const { rows } = await pool.query(
    `SELECT s.collection_name AS "collectionName", ${RECIPE_COLUMNS}
     ${RECIPE_FROM}
     JOIN saved_recipes s ON s.recipe_id = r.id
     JOIN users saver ON saver.id = s.user_id
     WHERE saver.username = $1
     ORDER BY s.collection_name, s.created_at DESC`,
    [username],
  );

  const collections = new Map();
  rows.forEach(({ collectionName, ...recipe }) => {
    if (!collections.has(collectionName)) collections.set(collectionName, { name: collectionName, recipes: [] });
    collections.get(collectionName).recipes.push(recipe);
  });
  return [...collections.values()];
}

module.exports = {
  searchRecipes,
  getSuggestions,
  getFeaturedRecipes,
  getRecipeById,
  getRecipeComments,
  createRecipeComment,
  submitRating,
  getUserRecipeRating,
  createUser,
  getUserForLogin,
  getUserByUsername,
  getUserRecipes,
  getUserComments,
  getUserRatingsReceived,
  getUserCollections,
};
