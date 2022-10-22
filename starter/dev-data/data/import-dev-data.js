const fs = require('fs');
const mongoose = require('mongoose');
const Tour = require('../../models/tourModel');
const Review = require('../../models/reviewModel');
const User = require('../../models/userModel');
const dotenv = require('dotenv');
dotenv.config({ path: '../../config.env' });
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB)
  .then(() => console.log('DB CONNECTION SUCCESSFUL'))
  .catch(() => console.log('DATABASE CONNECTION ERROR'));

//READ JSON FILE
const tours = JSON.parse(fs.readFileSync('./tours.json', 'utf-8'));
const users = JSON.parse(fs.readFileSync('./users.json', 'utf-8'));
const reviews = JSON.parse(fs.readFileSync('./reviews.json', 'utf-8'));
//IMPORT DATA INTO DB
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, {
      validateBeforeSave: false,
    });
    await Review.create(reviews);
    console.log('DATA SUCCESSFULLY LOADED ');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};
//DELETE ALL DATA FROM COLLECTION

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('DATA SUCCESSFULLY deleted ');
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
