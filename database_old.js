//directors
require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();

const DB_SOURCE = process.env.DB_SOURCE;

const db = new sqlite3.Database(DB_SOURCE, (err) => {
  if (err) {
    console.error(err.message);
    throw err;
  } else {
    console.log('Oke Sudah Terhubung...');
    
    db.run(`
      CREATE TABLE IF NOT EXISTS directors (
        id INTEGER NOT NULL,
        name VARCHAR NOT NULL,
        birthYear INTEGER NOT NULL,
        PRIMARY KEY (id)
      )
    `, (err) => {
      if (err) {
        console.error("Gagal membuat tabel:", err.message);
      } else {
        console.log('tabel directors berhasil dibuat');
        const insert = 'INSERT OR IGNORE INTO directors (id, name, birthYear) VALUES (?, ?, ?)';
        db.run(insert, [1, "Prof.Hatta", 1995]);
        db.run(insert, [2, "Fahmi Ridwan", 2000]);
        db.run(insert, [3, "Haris Nuddin", 1900]);
      }
    });


    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user'
  )`,
      (err) => {
        if (err) {
          console.error("Gagal membuat tabel users:", err.message);
        } else {
          console.log('Terhubung ke database SQLite.');
        };
      }
    );

    db.run(
      `CREATE TABLE IF NOT EXISTS movies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                director TEXT NOT NULL,
                year INTEGER NOT NULL
            )`,
      (err) => {
        if (err) {
          console.log("Tabel 'movies' sudah ada atau terjadi kesalahan.");
        } else {
          console.log("Tabel 'movies' berhasil dibuat.");
          const insert = "INSERT INTO movies (title, director, year) VALUES (?,?,?)";
          db.run(insert, ["Parasite", "Bong Joon-ho", 2019]);
          db.run(insert, ["The Dark Knight", "Christopher Nolan", 2008]);
        }
      }
    );
  }
});

module.exports = db;