const mongoose = require('mongoose');

const dotenv = require('dotenv');
process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT EXCEPTION, shutting down...');
  process.exit(1);
});

dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

//ONLINE DB
mongoose.connect(DB).then(() => console.log('DB CONNECTION SUCCESSFUL'));
// .catch(() => console.log('DATABASE CONNECTION ERROR'));

const port = process.env.PORT|| 3000;
const server = app.listen(port, '127.0.0.1', () => {
  console.log(`App running on port ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log(err);
  console.log('UNHANDLED REJECTION, shutting down...');
  server.close(() => {
    process.exit(1);
  });
});

// console.log(x);
