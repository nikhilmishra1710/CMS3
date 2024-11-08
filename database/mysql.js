const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();
module.exports = class Mysql {
  static connect() {

    const db = mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: 'cumsdbms',
    });

    db.connect((err) => {
      if (err) {
        throw err;
      }
      console.log('Mysql Connected');
    });
    return db;
  }
};
