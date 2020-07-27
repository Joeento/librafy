'use strict';

const config = require('../config');
const jwt = require('jsonwebtoken');

function userGate(req, res, next) {
  //get the auth header
  const authHeader = req.headers.authorization;
  //remove "Bearer: " from header
  const token = authHeader && authHeader.split(' ')[1];
  //if no token included, return 401 code
  if (token === null) return res.sendStatus(401);

  //decrypt the jwt, if valid set the logged in user, otherwise
  //return "Forbidden"
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

  //decrypt the jwt, if valid AND user.is_librarian == true, set the logged in
  //user, otherwise return "Forbidden"
  jwt.verify(token, config.token_secret, (err, user) => {
    if (err || !user.is_librarian) return res.sendStatus(403);
    req.user = user;
    next();
   });
}

module.exports = { userGate, librarianGate };
