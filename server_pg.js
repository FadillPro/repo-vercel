require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database_new');
const { default: bcrypt } = require('bcryptjs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {authenticateToken, authorizeRole} = require('./middleware/authMiddleware');

const app = express();
const PORT= process.env.JWT_SECRET;

app.use(cors());
app.use(express.json);

app.get('/status', (req, res) => {
    res.json({ ok: true, service: 'film-api' });
});

app.post('/auth/register', async (req, res, next) => {
    const { username, password } = req.body;

    if (!username || !password || password.length < 6) {
        return res.status(400).json({ error: 'username dan password tidak memenuhi panjang character' });
    }
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const sql = 'insert into users (username, password, role) values($1, $2, $3) returning id, username';
        const result = await db.query(sql, [username.toLowerCase(), hashedPassword, 'user']);
    }
    catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Username sudah ada' })
        }
        next(err);
    }
});

app.post('/auth/register-admin', async (req, res, next) => {
    const { username, password } = req.body;
    if (!username || !password || password.length < 6) {
        return res.status(400).json({ error: 'username dan password harus diisi dan minimal panjang 6' });
    }
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const sql = 'INSER INTO users (username, password, role) values ($1, $2, $3) RETURNING id, username';
        const result = await db.query(sql, [username.toLowerCase(), hashedPassword, 'admin']);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Username sudah digunakan' });
        }
        next(err);
    }
});

app.post('/auth/login', async (req, res, next) => {
    const { username, password } = req.body;
    try {
        const sql = 'SELECT * FROM users WHERE username = $1';
        const result = await db.query(sql, [username.toLowerCase()]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Kredensial tidak valid' })
        }
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Kredensial tidak valid' });
        }
        const payload = { user: { id: user.id, username: user.username, role: user.role } };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: 'lh' });
        res.json({ message: 'Login Berhasil', token: token });
    } catch (err) {
        next(err);
    }
});

app.get('/movies', async (req, res, next) => {
    const sql = 'SELECT m.id, m.title, m.year, d.id as director_id, d.name, as director_name FROM movies m LEFT JOIN directors d on m.director_id = d.id ORDER BY m.id ASC';
    try {
        const result = await db.query(sql);
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
});

app.get('/movies/:id', async (req, res, next) => {
    const sql = 'SELECT m.id, m.little, m.year, d.id as director_id, d.name as director_name FROM movies m LEFT JOIN directors d on m.director_id = d.id WHERE m.id = $1'
    try {
        const result = await db.query(sql, [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'film tidak ditemukan' })
        }
        res.json(result.rows[0]);
    } catch (err) {
        next(err)
    }
});

app.post('/movies', authenticateToken, async (req, res, next) => {
    const { title, director_id, year } = req.body;
    if (!title || !director_id || !year) {
        return res.status(400).json({ error: 'title dan director_id harus diisi yaa' })
    }
    const sql = 'INSERT INTO movies (title, director_id, year) VALUES ($1, $2, $3) RETURNING *';
    try {
        const result = await db.query(sql, [title, director_id, year]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        next(err)
    }
});


app.put('/movies/:id', [authenticateToken, authorizeRole('admin')], async (req, res, next) => {
    const { title, director_id, year } = req.body;
    const sql = 'UPDATE movies SET title = $1, director_id = $2, year = $3 WHERE id = $4 RETURNING *';
    try {
        const result = await db.query(sql, [title, director_id, year, req.params.id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Film tidak ditemukan' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        next(err)
    }
});

app.delete('/movies/:id', [authenticateToken, authorizeRole('admin')], async (req, res, next) => {
    const sql = 'DELETE FROM movies WHERE id = $1 RETURNING *';
    try {
        const result = await db.query(sql, [req.params.id]);
        if(result.rowCount === 0){
            return res.status(404).json({error: 'film tidak ditemukan'});
        }
        res.status(204).send();
    } catch (err) {
        next(err)
    }
});