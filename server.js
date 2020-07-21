'use strict';

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const config = require('./config');
const auth = require('./middleware/auth');

const Book = require('./models/Book');

const API_PORT = config.api_port;

const app = express();
app.use(cors());
const router = express.Router();


mongoose.connect(config.mongo_url, { useUnifiedTopology: true, useNewUrlParser: true });

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
		res.json({success: false, error: e.message});
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
		res.json({success: false, error: e.message});
	}
});

router.delete('/book/:id', auth.librarianGate, async (req, res) => {
	const id = req.params.id;
	try {
		await Book.findByIdAndDelete(id);

		res.json({success: true, book_id: id});
	} catch (e) {
		res.json({success: false, error: e.message});
	}
});


app.use('/api', router);

app.listen(API_PORT, () => console.log('LISTENING ON PORT ' + API_PORT));
