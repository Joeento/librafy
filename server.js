'use strict';

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const config = require('./config');
const auth = require('./middleware/auth');

const Book = require('./models/Book');

const API_PORT = config.api_port;
const CHECKOUT_TIME = config.checkout_time;

const router = express.Router();
const app = express();

app.use(cors());

mongoose.connect(config.mongo_url, {
	useUnifiedTopology: true,
	useNewUrlParser: true
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

router.post('/books', auth.librarianGate, async (req, res) => {
  const data = req.body;
  data.available = true;
  const book = new Book(data);

  try {
    let savedBook =  await book.save(book);
    res.json({success: true, book: savedBook});
  } catch (e) {
    res.status(400).json({success: false, error: e.message});
  }
});

router.delete('/books/:id', auth.librarianGate, async (req, res) => {
  const id = req.params.id;
  try {
    await Book.findByIdAndDelete(id);

    res.json({success: true, book_id: id});
  } catch (e) {
    res.status(400).json({success: false, error: e.message});
  }
});

router.get('/books/overdue', auth.librarianGate, async (req, res) => {
  const currentDate = new Date();

  try {
    const books = await Book.find({
      available: false,
      due_date: {
        $lt: currentDate
      }
    });
    res.json({success: true, books: books});
  } catch (e) {
    res.status(400).json({success: false, error: e.message});
  }
});

router.post('/books/checkout', auth.userGate, async (req, res) => {
  const user = req.user;
	const isbn = req.body.isbn;

	try {
		const booksCheckedOut = await Book.find({
			available: false,
			checked_out_by: user._id
		});

		if (booksCheckedOut.length >= 3) {
			throw new Error('You currently have too many books checked out.  Please return some and try again.');
		}

		const bookIsOverDue = (book) => book.due_date < new Date();
		const hasOverdueBooks = booksCheckedOut.some(bookIsOverDue);

		if (hasOverdueBooks) {
			throw new Error('You currently have an overdue book.  Please return it and try again.');
		}

		const booksAvailable = await Book.find({
			available: true,
			isbn: isbn
		});

		if (booksAvailable.length == 0) {
			throw new Error('There are no copies of that book currently available.  Please try again later.');
		}

		let dueDate = new Date();
		dueDate.setDate(dueDate.getDate() + parseInt(CHECKOUT_TIME));

		const book = booksAvailable[0];
		book.available = false;
		book.checked_out_by = user._id;
		book.due_date = dueDate;
		const updatedBook = await book.save();
		res.json({success: true, book: updatedBook});
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
		const updatedBook = await book.save();
		res.json({success: true, book: updatedBook});
	} catch (e) {
		res.status(400).json({success: false, error: e.message});
	}
});

router.get('/users/checked-out-books', auth.userGate, async (req, res) => {
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
