import jwt from 'jsonwebtoken';

function authJwt(req, res, next) {
  const header = req.header('authorization') || '';
  const token = header.toLowerCase().startsWith('bearer ')
    ? header.slice(7).trim()
    : null;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    req.user = {
      id: decoded.id,
      email: decoded.email,
    };
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export default authJwt;
