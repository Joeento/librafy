'use strict';

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const config = require('./config');
const auth = require('./middleware/auth');

const Book = require('./models/Book');

const API_PORT = config.api_port;
const CHECKOUT_TIME = 14;

const app = express();
app.use(cors());
const router = express.Router();

mongoose.connect(config.mongo_url, {
	useUnifiedTopology: true,
	useNewUrlParser: true
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


router.get('/books/overdue', auth.librarianGate, async (req, res) => {
  const current_date = new Date();

  try {
    const books = await Book.find({
      available: false,
      due_date: {
        $lt: current_date
      }
    });
    res.json({success: true, books: books});
  } catch (e) {
    res.status(400).json({success: false, error: e.message});
  }
});

router.post('/books', auth.librarianGate, async (req, res) => {
  const data = req.body;
  data.available = true;
  const book = new Book(data);

  try {
    let saved_book =  await book.save(book);
    res.json({success: true, book: saved_book});
  } catch (e) {
    res.status(400).json({success: false, error: e.message});
  }
});

router.delete('/book/:id', auth.librarianGate, async (req, res) => {
  const id = req.params.id;
  try {
    await Book.findByIdAndDelete(id);

    res.json({success: true, book_id: id});
  } catch (e) {
    res.status(400).json({success: false, error: e.message});
  }
});

router.post('/books/checkout', auth.userGate, async (req, res) => {
  const user = req.user;
	const isbn = req.body.isbn;

	try {
		const books_checked_out = await Book.find({
			available: false,
			checked_out_by: user._id
		});

		if (books_checked_out.length >= 3) {
			throw new Error('You currently have too many books checked out.  Please return some and try again.');
		}

		const bookIsOverDue = (book) => book.due_date < new Date();
		const hasOverdueBooks = books_checked_out.some(bookIsOverDue);

		if (hasOverdueBooks) {
			throw new Error('You currently have an overdue book.  Please return it and try again.');
		}

		const books_available = await Book.find({
			available: true,
			isbn: isbn
		});

		if (books_available.length == 0) {
			throw new Error('There are no copies of that book currently available.  Please try again later.');
		}

		let due_date = new Date();
		due_date.setDate(due_date.getDate() + parseInt(CHECKOUT_TIME));

		const book = books_available[0];
		book.available = false;
		book.checked_out_by = user._id;
		book.due_date = due_date;
		const updated_book = await book.save();
		res.json({success: true, book: updated_book});
	} catch (e) {
		res.status(400).json({success: false, error: e.message});
	}
});

router.post('/books/return', auth.userGate, async (req, res) => {
	const user = req.user;
	const isbn = req.body.isbn;

	try {
		const book = await Book.findOne({
			available: false,
			checked_out_by: user._id,
			isbn: isbn
		});

		if (!book) {
			throw new Error('You do not seem to have this book checked out, and cannot return it.')
		}

		book.available = true;
		book.checked_out_by = undefined;
		book.due_date = undefined;
		const updated_book = await book.save();
		res.json({success: true, book: updated_book});
	} catch (e) {
		res.status(400).json({success: false, error: e.message});
	}
});

router.post('/user/checked-out', auth.userGate, async (req, res) => {
	const user = req.user;

	try {
		const books = await Book.find({
			available: false,
			checked_out_by: user._id,
		});

		res.json({success: true, books: books});
	} catch (e) {
		res.status(400).json({success: false, error: e.message});
	}
});

app.use('/api', router);

app.listen(API_PORT, () => console.log('LISTENING ON PORT ' + API_PORT));
