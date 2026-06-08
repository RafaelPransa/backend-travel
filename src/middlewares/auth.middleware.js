const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message: 'Akses ditolak. Token tidak ditemukan atau format salah.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, name, role, iat, exp }
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Token tidak valid atau sudah kedaluwarsa.'
    });
  }
};

/**
 * Middleware opsional: Decode JWT jika ada, tapi TIDAK menolak request jika tidak ada token.
 * Berguna untuk endpoint publik yang tetap ingin merekam user_id jika customer sudah login.
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // Lanjutkan tanpa req.user
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (error) {
    // Token tidak valid, abaikan saja (tetap lanjutkan sebagai guest)
  }

  next();
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Anda tidak memiliki hak akses untuk resource ini.'
      });
    }
    next();
  };
};

module.exports = {
  authenticate,
  optionalAuth,
  authorize
};
