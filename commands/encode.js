'use strict';

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');

async function main(id) {
	mongoose.connect(config.mongo_url, {
    useUnifiedTopology: true,
    useNewUrlParser: true
  });
	const user = await User.findById(id);

	console.log(jwt.sign(user.toJSON(), config.token_secret));
	mongoose.connection.close();
}

main(process.argv[2]);
