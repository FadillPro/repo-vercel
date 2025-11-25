require('dotenv').config;

const express = require('express');
const cors = require('cors');
const db = require('./database_old.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const app = express();
const PORT = process.env.PORT || 3200   ;
const {authenticateToken, authorizeRole} = require('./middleware/authMiddleware.js');

app.use(express.json());
app.use(cors());

// let movies = [
//     { id: 1, title: 'parasite', director: 'hariyanto', year: 2019 },
//     { id: 2, title: 'sigmaBoy', director: 'Fahran', year: 2020 },
//     { id: 3, title: 'tenseiShitara', director: 'mnurfadillah', year: 2021 }
// ];

app.get('/', (req, res) => {
    res.send('server siapp!!');
});

// Register

app.post('/auth/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password || password.length < 6) {
        return res.status(400).json({ error: 'Username dan password (min 6 char) harus diisi' });
    }

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) return res.status(500).json({ error: 'Gagal memproses pendaftaran' });

        const sql = `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`;
        const params = [username.toLowerCase(), hashedPassword, 'user'];
        db.run(sql, params, function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint')) {
                    return res.status(409).json({ error: 'Username sudah digunakan' });
                }
                return res.status(500).json({ error: 'Gagal menyimpan user' });
            }
            res.status(201).json({ message: 'Registrasi berhasil', userId: this.lastID });
        });
    });
});

app.post('/auth/register-admin', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password || password.length < 6) {
        return res.status(400).json({ error: 'Username dan password (min 6 char) harus diisi' });
    }

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) return res.status(500).json({ error: 'Gagal memproses pendaftaran' });

        const sql = `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`;
        const params = [username.toLowerCase(), hashedPassword, 'admin']
        db.run(sql, params, function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint')) {
                    return res.status(409).json({ error: 'Admin Sudah Ada' });
                }
                return res.status(500).json({ error: 'Gagal menyimpan Admin' });
            }
            res.status(201).json({ message: 'Registrasi berhasil', userId: this.lastID });
        });
    });
});

//LOGIN

app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password harus diisi' });
  }

    const sql = 'SELECT * FROM users WHERE username = ?';
    db.get(sql, [username.toLowerCase()], (err, user) => {
        if (err || !user) {
            return res.status(401).json({ error: 'Kredensial tidak valid' });
        }

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err || !isMatch) {
                return res.status(401).json({ error: 'Kredensial tidak valid' });
            }

            const payload = { user: 
                { 
                    id: user.id, 
                    username: user.username,
                    role: user.role 
                }
            };
            jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
                if (err) return res.status(500).json({ error: 'Gagal membuat token' });
                res.json({ message: 'Login berhasil', token });
            });
        });
    });
});

app.get('/movies', (req, res) => {
    const sql = "SELECT * FROM movies ORDER BY id ASC";
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// app.get('/movies', (req, res) =>{
//     res.json(movies);
// });

app.get('/movies/:id', (req, res) => {
    db.get('SELECT * FROM movies WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Film tidak ditemukan' });
        res.json(row);
    });
});

// app.get('/movies/:id', (req, res) => {
//     const sql = "SELECT * FROM movies WHERE id = ?";
//     db.get(sql, [req.params.id], (err, row) => {
//         if (err) {
//             return res.status(500).json({ error: err.message });
//         }
//         if (!row) {
//             return res.status(404).json({ error: 'Film tidak ditemukan' });
//         }
//         res.json(row);
//     });
// });

// //dapatkan
// // app.get('/movies/:id',(req, res) =>{
// //     const movieId = parseInt(req.params.id);
// //     const movie = movies.find(m => m.id === movieId);

// //     if(!movie){
// //         return res.status(404).json({message: 'Film tidak ditemukan->(get)'});
// //     }

// //     res.json(movie);
// // });

// app.post('/movies', (req, res) => {
//     const { title, director, year } = req.body;
//     if (!title || !director || !year) {
//         return res.status(400).json({ error: 'title, director, year wajib diisi!' });
//     }

//     const sql = 'INSERT INTO movies (title, director, year) VALUES (?,?,?)';
//     db.run(sql, [title, director, year], function (err) {
//         if (err) {
//             return res.status(500).json({ error: err.message });
//         }
//         res.status(201).json({ id: this.lastID, title, director, year });
//     });
// });

// // //kirim

app.post('/movies', authenticateToken, (req, res) => {
    const { title, director, year } = req.body;
    if (!title || !director || !year) {
        return res.status(400).json({ error: 'Data film belum lengkap' });
    }

    const sql = `INSERT INTO movies (title, director, year) VALUES (?, ?, ?)`;
    db.run(sql, [title, director, year], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Film berhasil ditambahkan', movieId: this.lastID });
    });
});

app.put('/movies/:id', [authenticateToken, authorizeRole('admin')], (req, res) => {
    const { title, director, year } = req.body;
    const sql = `UPDATE movies SET title=?, director=?, year=? WHERE id=?`;
    db.run(sql, [title, director, year, req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Film berhasil diperbarui' });
    });
});
// // app.post('/movies', (req, res) => {
// //     const { title, director, year } = req.body;

// //     if (!title || !director || !year) {
// //         return res.status(404).json({ message: 'field harus diisi semua' });
// //     }

// //     const newId = movies.length > 0 ? movies[movies.length - 1].id + 1 : 1;
// //     const newMovie = { id: newId, title, director, year };

// //     movies.push(newMovie);

// //     res.status(201).json(newMovie);
// // });

// app.put('/movies/:id', (req, res) => {
//     const { title, director, year } = req.body;
//     const sql = 'UPDATE movies SET title = ?, director = ?, year = ? WHERE id = ?';
//     db.run(sql, [title, director, year, req.params.id],
//         function (err) {
//             if (err) {
//                 return res.status(500).json({ error: err.message });
//             }
//             if (this.changes === 0) {
//                 return res.status(404).json({ error: 'Film tidak ditemukan' });
//             }
//             res.json({ id: Number(req.params.id), title, director, year });
//         });
// })

// // //perbarui
// // app.put('/movies/:id', (req, res) => {
// //     const nomorFilm = parseInt(req.params.id);
// //     const cariFilm = movies.findIndex(m => m.id === nomorFilm);

// //     if (cariFilm === -1) {
// //         return res.status(404).json({ message: 'film tidak ditemukan->(put)' });
// //     }

// //     const { title, director, year } = req.body;

// //     if (!title || !director || !year) {
// //         return res.status(400).json({ message: 'fieldnya harus sama yaa!!' });
// //     }

// //     const updatedMovie = { id: nomorFilm, title, director, year };

// //     movies[cariFilm] = updatedMovie;

// //     res.status(200).json(updatedMovie);
// // });

app.delete('/movies/:id', [authenticateToken, authorizeRole('admin')], (req, res) => {
    const sql = `DELETE FROM movies WHERE id=?`;
    db.run(sql, [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Film berhasil dihapus' });
    });
});


// app.delete('/movies/:id', (req, res) => {
//   const sql = 'DELETE FROM movies WHERE id = ?';
//   db.run(sql, [req.params.id], function(err) {
//     if (err) {
//       return res.status(500).json({ error: err.message });
//     }
//     if (this.changes === 0) {
//       return res.status(404).json({ error: 'Film tidak ditemukan' });
//     }
//     res.status(204).send();
//   });
// })

// app.delete('/movies/:id', (req, res) => {
//     const nmrFilm = parseInt(req.params.id);
//     const indxMovie = movies.findIndex(m => m.id === nmrFilm);

//     if (indxMovie === -1) {
//         return res.status(404).json({ message: 'film tidak ditemukan->(delete)' })
//     }

//     movies.splice(indxMovie, 1);

//     res.status(204).send();
// });

// end movies

// let directors = [
//     { id: 1, name: 'Fahran', birthYear: 1998 },
//     { id: 2, name: 'Hasanuddin', birthYear: 1994 },
//     { id: 3, name: 'Kinara', birthYear: 1995 },
//     { id: 4, name: 'Fajrul', birthYear: 1997 },
//     { id: 5, name: 'Adi', birthYear: 1999 }
// ]

app.get('/directors', (req, res) => {
    db.all('SELECT * FROM directors', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// app.get('/directors', (req, res) => {
//     const sql = "SELECT * FROM directors ORDER BY id ASC";
//     db.all(sql, [], (err, rows) => {
//         if (err) {
//             return res.status(500).json({ error: err.message });
//         }
//         res.json(rows);
//     });
// });

//mendapatkan data semua director
// app.get('/directors', (req, res) => {
//     res.json(directors);
// });

app.get('/directors/:id', (req, res) => {
    db.get('SELECT * FROM directors WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Sutradara tidak ditemukan' });
        res.json(row);
    });
});

// app.get('/directors/:id', (req, res) => {
//     const sql = "SELECT * FROM directors WHERE id = ?";
//     db.get(sql, [req.params.id], (err, row) => {
//         if (err) {
//             return res.status(500).json({ error: err.message });
//         }
//         if (!row) {
//             return res.status(404).json({ error: 'directors tidak ditemukan' });
//         }
//         res.json(row);
//     });
// });

//mendapatkan data berdasarkan id atau nomor
// app.get('/directors/:id', (req, res) => {
//     const directorsId = parseInt(req.params.id);
//     const director = directors.find(d => d.id === directorsId);

//     //berfungsi apabila yang yang dimasukkan salah
//     if (!director) {
//         return res.status(404).json({ message: 'sutradara tidak ditemukan->(get)' });
//     }
//     //ini untuk jika kondisinya benar
//     res.json(director);
// });

app.post('/directors', authenticateToken, (req, res) => {
    const { name, birth_year, nationality } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Nama sutradara wajib diisi' });
    }

    const sql = `INSERT INTO directors (name, birth_year, nationality) VALUES (?, ?, ?)`;
    db.run(sql, [name, birth_year, nationality], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Sutradara berhasil ditambahkan', directorId: this.lastID });
    });
});


// app.post('/directors', (req, res) => {
//     const { id, name, birthYear } = req.body;
//     if (!id || !name || !birthYear) {
//         return res.status(400).json({ error: 'name, director, year wajib diisi!' });
//     }

//     const sql = 'INSERT INTO directors (id, name, birthYear) VALUES (?,?,?)';
//     db.run(sql, [id, name, birthYear], function (err) {
//         if (err) {
//             return res.status(500).json({ error: err.message });
//         }
//         res.status(201).json({ id: this.lastID, id, name, birthYear });
//     });
// });

//ini untuk mengirim atau menambah sutradara baru
// app.post('/directors', (req, res) => {
//     const { id, name, birthYear } = req.body;

//     //berfungsi apa bila user mau menambah baru fieldnya kurang
//     if (!id || !name || !birthYear) {
//         return res.status(404).json({ message: 'field harus diisi semua(id, nama, birthYear)' });
//     }

//     //jika user sudah memasukkan field dengan lengkap
//     const idBru = directors.length > 0 ? directors[directors.length - 1].id + 1 : 1;
//     const newDir = { id: idBru, name, birthYear };

//     directors.push(newDir);

//     res.status(201).json(newDir);
// });

app.put('/directors/:id', authenticateToken, (req, res) => {
  const { name, birth_year, nationality } = req.body;
  const sql = `UPDATE directors SET name=?, birth_year=?, nationality=? WHERE id=?`;
  db.run(sql, [name, birth_year, nationality, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Data sutradara berhasil diperbarui' });
  });
});

// app.put('/directors/:id', (req, res) => {
//     const { id, name, birthYear } = req.body;
//     const sql = 'UPDATE directors SET id = ?, name = ?, birthYear = ? WHERE id = ?';
//     db.run(sql, [id, name, birthYear, req.params.id],
//         function (err) {
//             if (err) {
//                 return res.status(500).json({ error: err.message });
//             }
//             if (this.changes === 0) {
//                 return res.status(404).json({ error: 'Direktor tidak ditemukan' });
//             }
//             res.json({ id: Number(req.params.id), id, name, birthYear });
//         });
// });

//berfungsi untuk memperbarui data dari direktor
// app.put('/directors/:id', (req, res) => {
//     const nomorDir = parseInt(req.params.id);
//     const cariDir = directors.findIndex(d => d.id === nomorDir);

//     if (cariDir === -1) {
//         return res.status(404).json({ message: 'Sutradara tidak ditemukan->(put)' });
//     }

//     const { id, name, birthYear } = req.body;

//     //berfungsi apa bila user mau merubah baru fieldnya kurang
//     if (!id || !name || !birthYear) {
//         return res.status(400).json({ message: 'field yang dimasukkan kurang! (id, name, birthYear)->put' });
//     }

//     //jika kondisinya sudah benar
//     const updatedDir = { id: nomorDir, name, birthYear };

//     directors[cariDir] = updatedDir;

//     res.status(200).json(updatedDir);
// });

app.delete('/directors/:id', (req, res) => {
  const sql = 'DELETE FROM directors WHERE id = ?';
  db.run(sql, [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'directors tidak ditemukan' });
    }
    res.status(204).send();
  });
});

//berfungsi untuk menghapus data direktor berdasarkan id yang dipilih
// app.delete('/directors/:id', (req, res) => {
//     const nmrDir = parseInt(req.params.id);
//     const indxDir = directors.findIndex(d => d.id === nmrDir);

//     if (indxDir === -1) {
//         return res.status(404).json({ message: 'Sutradara tidak ditemukan->(delete)' });
//     }

//     directors.splice(indxDir, 1);

//     res.status(204).send();
// });

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});