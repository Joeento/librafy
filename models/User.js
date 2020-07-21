'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    first_name: String,
    last_name: String,
    is_librarian: {
      type: Boolean,
      default: false
    },
    created_at: Date,
    updated_at: Date
});


userSchema.pre('save', function(next) {
    const currentDate = new Date();
    this.updated_at = currentDate;
    if (!this.created_at)
        this.created_at = currentDate;
    next();
});

var User = mongoose.model('User', userSchema);

module.exports = User;
