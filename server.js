const mongoose = require('mongoose');
const dotenv = require('dotenv');

// ==>>catching uncaught exception
/*
what exactly are uncaught exceptions?
Well, all errors, or let's also call them bugs,that occur in our synchronous code
but are not handled anywhere are called uncaught exceptions.

ex:- console.log(x);   'error x is not defined'
*/
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION 🔴 shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});
dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => console.log('DB connection successful!'));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLER REJECTION 🔴 shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    // to shut down the server
    process.exit(1);
  });
});

// 125934