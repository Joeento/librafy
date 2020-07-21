'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookSchema = new Schema({
  //ISBN's sometimes include 'X' and therefore cannot be saved as integers
  isbn: {
    type: String,
    required: true
  },
  title: String,
  author: String,
  available: Boolean,
  checked_out_by: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  due_date: Date,
  created_at: Date,
  updated_at: Date
});


bookSchema.pre('save', function(next) {
  const currentDate = new Date();
  this.updated_at = currentDate;
  if (!this.created_at) {
    this.created_at = currentDate;
  }
  next();
});

var Book = mongoose.model('Book', bookSchema);

module.exports = Book;
