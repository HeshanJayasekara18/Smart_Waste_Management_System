function devOnly(req, res, next) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ message: 'Not Found' });
  }
  return next();
}

module.exports = devOnly;
