// Login helpers for routes.
//
// Put requireLogin in front of any route that needs an account, for example:
//   router.post('/:id/ratings', requireLogin, async (req, res) => { ... });
// Inside the handler, req.session.user is { id, username }.
function requireLogin(req, res, next) {
  if (req.session.user) return next();
  if (req.method === 'GET') req.session.returnTo = req.originalUrl;
  res.redirect('/login');
}

// Only same-site paths like /recipes/3, so a crafted link cannot send people
// to another website after they log in.
function safeReturnTo(url) {
  return typeof url === 'string' && url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/\\') ? url : '/';
}

module.exports = { requireLogin, safeReturnTo };
