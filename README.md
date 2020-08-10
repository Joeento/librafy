## 📖 librafy

Welcome to librafy, an all-in-one API for management of books at your local library!

## What's Included
librafy contains all the code you'll need to create, track, check-in, and checkout books.  These actions are broken down into 6 endpoints:

 1. `POST /books`
		*Requires: Librarian JWT*
		 An endpoint adding a new book to the database.  Requires an `isbn` number or it will return an error.  `title` and `author` are also valid fields but are not required.  Returns the mongo document of the book you just created.
 2. `DELETE /books/:id`
		*Requires: Librarian JWT*
		 An endpoint for deleting copies of books from the database.  Requires `id` be set to a valid mongo ObjectId.  Returns the id of the book that was just deleted.
 3. `GET /books/overdue`
		*Requires: Librarian JWT*
		 An endpoint for seeing a list of all books that are currently overdue.  Returns each book's mongo document.
 4. `POST /books/checkout`
 		*Requires: User JWT*
		 An endpoint to allow users(or librarians) to checkout a book from the library.  Requires the `isbn` of the book you want to check out.  Returns the updated book document with a due date field 2 weeks in the future.  If the book is not available, the user has 3 books checked out, or the user has an overdue book, the checkout will be denied and an error will be returned.
 5. `POST /books/return`
	*Requires: User JWT*
	An endpoint to allow users(or librarians) to return a book to the library.  Requires the `isbn` of the book you want to return.  On return the book will become available again and the due_date will be erased.  Returns updated book document.
 6. `GET /users/checked-out`
	*Requires: User JWT*
	An endpoint for viewing all checked out books by a given user. Requires no fields.  Returns all book documents where the user id == book.checked_out_by.

## Setup
librafy runs on Node.js and Express, and utilizes a Mongo database, so you will each of those installed to get started.  Once those are ready simply clone this repo and:
1) Create your own `config.js` file for enviornment variables.  You can find an example in `config_example.js`
1) Install your dependencies using

       npm install

2) Then, start a server using

        npm start
NOTE: A copy of a dummy DB is available on request.
ALSO NOTE: In order to request any of these endpoints you'll need a JWT token to simulate being logged in as either a user or a librarian.  Since there is no login endpoint in the schema, you can copy the ObjectID of your user and run `node commands/encode.js {user_id}` to generate an access token for that user.  When running a request simple include `Authorization: Bearer {access_token}` in the headers.  For example, a request to create a book may look like:
```curl -X POST \
  http://localhost:3001/api/books \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc19saWJyYXJpYW4iOnRydWUsIl9pZCI6IjVmMTcyMmQ5MzBkZDk0NWJlMWY1NmZkYiIsImZpcnN0X25hbWUiOiJVc2VyIiwibGFzdF9uYW1lIjoiMSIsInVwZGF0ZWRfYXQiOiIyMDIwLTA3LTIxVDE3OjE2OjE3LjU5M1oiLCJjcmVhdGVkX2F0IjoiMjAyMC0wNy0yMVQxNzoxNjoxNy41OTNaIiwiX192IjowLCJpYXQiOjE1OTU0NDAzNjN9.4JV1XzzQGkJeiNyUIze_EDR6-emrG2Owo5JgRVOH4WM' \
  -H 'Cache-Control: no-cache' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'title=Bossypants&isbn=9780316056861&author=Tina%20Fey'
  ```

## Next Steps

 * Convert to TypeScript to make code cleaner and more readable.
 * Remove `Book.available`field - determining whether or not the book is available can be done by checking if `Book.checked_out_by` is null
 * Make sure the `isbn` is valid and reject it if it is not.
 * Write out tests that run through popular use cases (eg. User 1 adds, book, User 2 checks book out, User 1 checks to see if book is visible in checked out list)
 * Come up with better name...?
