-- Sample data for testing, matching db/sample-data.js. Run after schema.sql.
-- These accounts cannot log in because their password hashes are not real.

INSERT INTO users (username, email, password_hash, first_name, last_name, bio) VALUES
  ('sample_cook', 'sample_cook@example.com', 'not-a-real-hash', 'Sam', 'Cook', 'Sample profile for testing.'),
  ('test_baker', 'test_baker@example.com', 'not-a-real-hash', 'Tess', 'Baker', 'Another sample profile.'),
  ('sample_taster', 'sample_taster@example.com', 'not-a-real-hash', 'Tia', 'Taster', 'Sample profile used for ratings.');

INSERT INTO recipes (user_id, title, ingredients, instructions, cuisine, meal_type, dietary_tags, cook_time_minutes, difficulty) VALUES
  (1, 'Chicken Tacos', ARRAY['1 lb chicken', '8 tortillas', '1 cup salsa'], E'Cook the chicken.\nAdd the salsa.\nServe in warm tortillas.', 'Mexican', 'Dinner', ARRAY['Dairy-free'], 25, 'Easy'),
  (1, 'Margherita Pasta', ARRAY['8 oz pasta', '2 cups tomatoes', '1 cup mozzarella', 'Fresh basil'], E'Boil the pasta.\nCook the tomatoes.\nToss with mozzarella and basil.', 'Italian', 'Lunch', ARRAY['Vegetarian'], 20, 'Easy'),
  (2, 'Veggie Fried Rice', ARRAY['3 cups cooked rice', '2 cups mixed vegetables', '3 tbsp soy sauce'], E'Stir-fry the vegetables.\nAdd the rice.\nSeason with soy sauce.', 'Asian', 'Dinner', ARRAY['Vegan', 'Dairy-free'], 35, 'Medium'),
  (2, 'Blueberry Pancakes', ARRAY['2 cups flour', '2 eggs', '1 cup milk', '1 cup blueberries'], E'Mix the batter.\nFold in the blueberries.\nCook on a hot griddle.', 'American', 'Breakfast', ARRAY['Vegetarian'], 15, 'Easy');

INSERT INTO ratings (user_id, recipe_id, stars) VALUES
  (2, 1, 5),
  (3, 1, 4),
  (2, 2, 4),
  (1, 4, 5);

INSERT INTO comments (recipe_id, user_id, parent_comment_id, body) VALUES
  (1, 2, NULL, 'Great weeknight dinner.'),
  (1, 1, 1, 'Glad you liked it!');
