'use strict';

const config = require('../config');
const jwt = require('jsonwebtoken');

function userGate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (token === null) return res.sendStatus(401);

  jwt.verify(token, config.token_secret, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

function librarianGate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (token === null) return res.sendStatus(401);

  jwt.verify(token, config.token_secret, (err, user) => {
    if (err || !user.is_librarian) return res.sendStatus(403);
    req.user = user;
    next();
   });
}

module.exports = { userGate, librarianGate };
