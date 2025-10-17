function mockUser(req, res, next) {
  if (process.env.NODE_ENV === 'production') {
    return next();
  }

  if (req.user && req.user.id) {
    return next();
  }

  const headerId = req.header('x-user-id');
  if (headerId) {
    req.user = { id: headerId };
    return next();
  }

  req.user = {
    id: process.env.DEFAULT_TEST_USER_ID || '65f9b1e7b2f44b9a9b0a1234',
  };
  return next();
}

export default mockUser;
