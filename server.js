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
    res.json({book: savedBook});
  } catch (e) {
    //if the save fails, send the error back and a user error code
    res.status(400).json({error: e.message});
  }
});

router.delete('/books/:id', auth.librarianGate, async (req, res) => {
  const id = req.params.id;
  try {
    await Book.findByIdAndDelete(id);

    res.json({book_id: id});
  } catch (e) {
    res.status(400).json({error: e.message});
  }
});

router.get('/books/overdue', auth.librarianGate, async (req, res) => {
  const currentDate = new Date();

  try {
    //query the database for a list of books that are currently checked out, and
    //have a due_date before today
    const books = await Book.find({
      available: false,
      due_date: {
        $lt: currentDate
      }
    });
    res.json({books: books});
  } catch (e) {
    res.status(400).json({error: e.message});
  }
});

router.post('/books/checkout', auth.userGate, async (req, res) => {
  //req.user contains the logged in user's mongo document
  //it is set by JWT in the userGate middleware
  const user = req.user;
	const isbn = req.body.isbn;

	try {
    //get all books checked out by the login user
		const booksCheckedOut = await Book.find({
			available: false,
			checked_out_by: user._id
		});

    //if 3 or more books have been checked out, throw an error
		if (booksCheckedOut.length >= 3) {
			throw new Error('You currently have too many books checked out.  Please return some and try again.');
		}

    //if any checked out book is overdue, throw an error
		const bookIsOverDue = (book) => book.due_date < new Date();
		const hasOverdueBooks = booksCheckedOut.some(bookIsOverDue);

		if (hasOverdueBooks) {
			throw new Error('You currently have an overdue book.  Please return it and try again.');
		}

		const booksAvailable = await Book.find({
			available: true,
			isbn: isbn
		});

    //if that isbn doesn't exist or all copies or checked out, throw an error
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
		res.json({book: updatedBook});
	} catch (e) {
		res.status(400).json({success: false, error: e.message});
	}
});

router.post('/books/return', auth.userGate, async (req, res) => {
	const user = req.user;
	const isbn = req.body.isbn;

	try {
    //get a copy of this book checked out by logged in user
		const book = await Book.findOne({
			available: false,
			checked_out_by: user._id,
			isbn: isbn
		});

    //if there are none, throw an error
		if (!book) {
			throw new Error('You do not seem to have this book checked out, and cannot return it.')
		}

    //otherwise make the book available again and remove the due_date
		book.available = true;
		book.checked_out_by = undefined;
		book.due_date = undefined;
		const updatedBook = await book.save();
		res.json({book: updatedBook});
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

		res.json({books: books});
	} catch (e) {
		res.status(400).json({success: false, error: e.message});
	}
});

app.use('/api', router);

app.listen(API_PORT, () => console.log('LISTENING ON PORT ' + API_PORT));
