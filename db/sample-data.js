// Temporary data so pages work before the database is connected.
// Delete this file once every function in db/queries.js uses SQL.
const users = [
  { id: 1, username: 'sample_cook', firstName: 'Sam', lastName: 'Cook', bio: 'Sample profile for testing.' },
  { id: 2, username: 'test_baker', firstName: 'Tess', lastName: 'Baker', bio: 'Another sample profile.' },
];

const recipes = [
  {
    id: 1,
    username: 'sample_cook',
    title: 'Chicken Tacos',
    cuisine: 'Mexican',
    mealType: 'Dinner',
    dietaryTags: ['Dairy-free'],
    cookTimeMinutes: 25,
    difficulty: 'Easy',
    photoUrl: null,
    averageRating: 4.5,
    reviewCount: 2,
    ingredients: ['1 lb chicken', '8 tortillas', '1 cup salsa'],
    instructions: 'Cook the chicken.\nAdd the salsa.\nServe in warm tortillas.',
  },
  {
    id: 2,
    username: 'sample_cook',
    title: 'Margherita Pasta',
    cuisine: 'Italian',
    mealType: 'Lunch',
    dietaryTags: ['Vegetarian'],
    cookTimeMinutes: 20,
    difficulty: 'Easy',
    photoUrl: null,
    averageRating: 4,
    reviewCount: 1,
    ingredients: ['8 oz pasta', '2 cups tomatoes', '1 cup mozzarella', 'Fresh basil'],
    instructions: 'Boil the pasta.\nCook the tomatoes.\nToss with mozzarella and basil.',
  },
  {
    id: 3,
    username: 'test_baker',
    title: 'Veggie Fried Rice',
    cuisine: 'Asian',
    mealType: 'Dinner',
    dietaryTags: ['Vegan', 'Dairy-free'],
    cookTimeMinutes: 35,
    difficulty: 'Medium',
    photoUrl: null,
    averageRating: 0,
    reviewCount: 0,
    ingredients: ['3 cups cooked rice', '2 cups mixed vegetables', '3 tbsp soy sauce'],
    instructions: 'Stir-fry the vegetables.\nAdd the rice.\nSeason with soy sauce.',
  },
  {
    id: 4,
    username: 'test_baker',
    title: 'Blueberry Pancakes',
    cuisine: 'American',
    mealType: 'Breakfast',
    dietaryTags: ['Vegetarian'],
    cookTimeMinutes: 15,
    difficulty: 'Easy',
    photoUrl: null,
    averageRating: 5,
    reviewCount: 1,
    ingredients: ['2 cups flour', '2 eggs', '1 cup milk', '1 cup blueberries'],
    instructions: 'Mix the batter.\nFold in the blueberries.\nCook on a hot griddle.',
  },
];

// parentCommentId is null for a comment and set to the parent's id for a reply.
const comments = [
  { id: 1, recipeId: 1, recipeTitle: 'Chicken Tacos', username: 'test_baker', parentCommentId: null, body: 'Great weeknight dinner.', createdAt: '2026-11-01' },
  { id: 2, recipeId: 1, recipeTitle: 'Chicken Tacos', username: 'sample_cook', parentCommentId: 1, body: 'Glad you liked it!', createdAt: '2026-11-02' },
];

module.exports = { users, recipes, comments };
