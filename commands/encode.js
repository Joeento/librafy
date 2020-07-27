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

  //get user by ID
	const user = await User.findById(id);

  //convert our user object to a JSON and encode it, the print it
	console.log(jwt.sign(user.toJSON(), config.token_secret));
	mongoose.connection.close();
}

//take the first argument passed by cli as user._id
main(process.argv[2]);
