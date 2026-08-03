const jwt = require('jsonwebtoken');

const authenticateKinesioJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET || 'secreto_super_seguro_kinesio', (err, decodedUser) => {
      if (err) {
        return res.status(403).json({ error: 'Token inválido o expirado. Acceso denegado.' });
      }

      // El payload del JWT debe incluir el ID del profesional
      req.user = decodedUser;
      
      next();
    });
  } else {
    res.status(401).json({ error: 'Autorización denegada. Token no proporcionado.' });
  }
};

module.exports = authenticateKinesioJWT;
