require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
// const Movie = require('./models/Movie');
const Director = require('./models/Directors');

connectDB(); // Panggil fungsi koneksi di awal

const app = express();
const PORT = process.env.PORT || 3300; // Gunakan PORT dari .env

app.use(cors());
app.use(express.json());

// Rute-rute akan ditempatkan di sini...

//movies
// STATUS CHECK
app.get('/status', (req, res) => {
    res.json({ ok: true, service: 'film-api' });
});

// GET ALL MOVIES
app.get('/movies', async (req, res, next) => {
    try {
        const movies = await Movie.find({});
        res.json(movies);
    } catch (err) {
        next(err);
    }
});

// GET MOVIE BY ID
app.get('/movies/:id', async (req, res, next) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (!movie) return res.status(404).json({ error: 'Film tidak ditemukan' });
        res.json(movie);
    } catch (err) {
        next(err);
    }
});

// CREATE MOVIE
app.post('/movies', async (req, res, next) => {
    try {
        const { title, director, year } = req.body;
        const newMovie = new Movie({ title, director, year });
        const savedMovie = await newMovie.save();
        res.status(201).json(savedMovie);
    } catch (err) {
        next(err);
    }
});

// UPDATE MOVIE BY ID
app.put('/movies/:id', async (req, res, next) => {
    try {
        const updatedMovie = await Movie.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!updatedMovie) return res.status(404).json({ error: 'Film tidak ditemukan' });
        res.json(updatedMovie);
    } catch (err) {
        next(err);
    }
});

// DELETE MOVIE BY ID
app.delete('/movies/:id', async (req, res, next) => {
    try {
        const deletedMovie = await Movie.findByIdAndDelete(req.params.id);
        if (!deletedMovie) return res.status(404).json({ error: 'Film tidak ditemukan' });
        res.json({ message: 'Film berhasil dihapus' });
    } catch (err) {
        next(err);
    }
});


// directors

// GET ALL DIRECTORS
app.get('/directors', async (req, res, next) => {
  try {
    const directors = await Director.find({});
    res.json(directors);
  } catch (err) {
    next(err);
  }
});

// GET director by ID
app.get('/directors/:id', async (req, res, next) => {
  try {
    const director = await Director.findById(req.params.id);
    if (!director) {
      return res.status(404).json({ error: 'Director tidak ditemukan' });
    }
    res.json(director);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Format ID tidak valid' });
    }
    next(err);
  }
});

// POST new director
app.post('/directors', async (req, res, next) => {
  try {
    const newDirector = new Director(req.body);
    const savedDirector = await newDirector.save();
    res.status(201).json(savedDirector);
  } catch (err) {
    next(err);
  }
});

// PUT director
app.put('/directors/:id', async (req, res, next) => {
  try {
    const updatedDirector = await Director.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedDirector) {
      return res.status(404).json({ error: 'Director tidak ditemukan' });
    }
    res.json(updatedDirector);
  } catch (err) {
    next(err);
  }
});

// DELETE director
app.delete('/directors/:id', async (req, res, next) => {
  try {
    const deletedDirector = await Director.findByIdAndDelete(req.params.id);
    if (!deletedDirector) {
      return res.status(404).json({ error: 'Director tidak ditemukan' });
    }
    res.json({ message: 'Director berhasil dihapus' });
  } catch (err) {
    next(err);
  }
});



// Fallback 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rute tidak ditemukan' });
});

// Error handler (opsional tapi bagus ditambahkan)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Terjadi kesalahan pada server' });
});

app.listen(PORT, () => {
  console.log(`Server aktif di http://localhost:${PORT}`);
});
