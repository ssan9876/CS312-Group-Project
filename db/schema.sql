-- TODO(Nick, Phase 1): starter draft of the schema. Change anything you need.
-- Run in pgAdmin 4: open the Query Tool on the recipes database, then run this file.

CREATE TABLE users (
  id            integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username      text NOT NULL UNIQUE,
  email         text NOT NULL UNIQUE, -- Open question: the signup sketch has email, the proposal table does not.
  password_hash text NOT NULL,        -- Store a hash only, never the password itself.
  first_name    text NOT NULL,
  last_name     text NOT NULL,
  bio           text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE recipes (
  id                integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id           integer NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title             text NOT NULL,
  ingredients       text[] NOT NULL,
  instructions      text NOT NULL,
  cuisine           text NOT NULL,
  meal_type         text NOT NULL,
  dietary_tags      text[] NOT NULL DEFAULT '{}',
  cook_time_minutes integer NOT NULL CHECK (cook_time_minutes > 0),
  difficulty        text NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  photo_url         text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX recipes_user_id_idx ON recipes (user_id);
CREATE INDEX recipes_cuisine_idx ON recipes (cuisine);
CREATE INDEX recipes_meal_type_idx ON recipes (meal_type);

-- One rating per user per recipe.
CREATE TABLE ratings (
  user_id    integer NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  recipe_id  integer NOT NULL REFERENCES recipes (id) ON DELETE CASCADE,
  stars      integer NOT NULL CHECK (stars BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, recipe_id)
);

CREATE INDEX ratings_recipe_id_idx ON ratings (recipe_id);

-- Replies are comments with parent_comment_id set.
-- Username and first and last name come from joining users, so they are not copied here.
CREATE TABLE comments (
  id                integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  recipe_id         integer NOT NULL REFERENCES recipes (id) ON DELETE CASCADE,
  user_id           integer NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  parent_comment_id integer REFERENCES comments (id) ON DELETE CASCADE,
  body              text NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX comments_recipe_id_idx ON comments (recipe_id);
CREATE INDEX comments_user_id_idx ON comments (user_id);
CREATE INDEX comments_parent_comment_id_idx ON comments (parent_comment_id);

CREATE TABLE saved_recipes (
  user_id         integer NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  recipe_id       integer NOT NULL REFERENCES recipes (id) ON DELETE CASCADE,
  collection_name text NOT NULL DEFAULT 'Favorites',
  created_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, recipe_id, collection_name)
);

CREATE INDEX saved_recipes_recipe_id_idx ON saved_recipes (recipe_id);
