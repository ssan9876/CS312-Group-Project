// Shared lists for the category page, filters, and recipe form.
module.exports = {
  MEAL_TYPES: ['Breakfast', 'Lunch', 'Dinner', 'Dessert'],
  CUISINES: ['Italian', 'Mexican', 'Asian', 'American'],
  DIETARY_TAGS: ['Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free'],
  DIFFICULTIES: ['Easy', 'Medium', 'Hard'],
  // min is inclusive and max is exclusive, so a 15-minute recipe is in 15-30.
  // max: null means no upper limit. Use these bounds in SQL too.
  COOK_TIME_RANGES: [
    { value: '0-15', label: 'Under 15 minutes', min: 0, max: 15 },
    { value: '15-30', label: '15-30 minutes', min: 15, max: 30 },
    { value: '30-60', label: '30-60 minutes', min: 30, max: 60 },
    { value: '60+', label: '60+ minutes', min: 60, max: null },
  ],
};
