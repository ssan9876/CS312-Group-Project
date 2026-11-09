// Placeholder for form actions nobody has built yet. Replace each use with the real handler.
module.exports = (task) => (req, res) => {
  res.status(501).render('error', { title: 'Not built yet', message: task });
};
