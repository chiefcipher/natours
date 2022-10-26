const mongoose = require("mongoose");
const chalk = require("chalk");
const dotenv = require("dotenv");
process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  console.log('error is ',err)
  console.log("UNCAUGHT EXCEPTION, shutting down...");
  process.exit(1);
});

dotenv.config({ path: "./config.env" });

const app = require("./app");

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

//ONLINE DB
mongoose.connect(DB).then(() => console.log("DB CONNECTION SUCCESSFUL"), {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
});
// .catch(() => console.log('DATABASE CONNECTION ERROR'));

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, "127.0.0.1", () => {
  chalk.green(console.log(`APP RUNNING ON PORT ${PORT}...`));
});
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION, shutting down...");
  server.close(() => {
    process.exit(1);
  });
});

// SIGTERM EVENT FROM HEROKU DYNO SHUTTING DOWN
// heroku sends this event every 24hrs to shut down our system
process.on("SIGTERM", () => {
  console.log("SIGTERM RECIEVED, shtting down gracefully");
  // this server.close ensures all running requests are completed
  server.close(() => {
    "server closed";
  });
});
// use heroku ps command to view all dynos
// console.log(x);
