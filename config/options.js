// Shared lists for the category page, filters, and recipe form.
module.exports = {
  MEAL_TYPES: ['Breakfast', 'Lunch', 'Dinner', 'Dessert'],
  CUISINES: ['Italian', 'Mexican', 'Asian', 'American'],
  DIETARY_TAGS: ['Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free'],
  DIFFICULTIES: ['Easy', 'Medium', 'Hard'],
  COOK_TIME_RANGES: [
    { value: '0-15', label: 'Under 15 minutes' },
    { value: '15-30', label: '15-30 minutes' },
    { value: '30-60', label: '30-60 minutes' },
    { value: '60+', label: '60+ minutes' },
  ],
};
