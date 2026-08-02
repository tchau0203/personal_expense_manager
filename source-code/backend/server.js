const express = require('express');
const cors = require('cors');
const { poolPromise } = require('../database/database');
const path = require('path');

const app = express();
const PORT = 3000;
const memoryExpenses = [];

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/api/expenses', async (req, res) => {
  try {
    const pool = await poolPromise;
    if (pool) {
      const result = await pool.query('SELECT * FROM expenses ORDER BY expense_date DESC');
      return res.json(result.rows);
    }

    return res.json(memoryExpenses.slice().reverse());
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const { description, amount, category, date } = req.body;
    const pool = await poolPromise;

    if (pool) {
      await pool.query(
        'INSERT INTO expenses (description, amount, category, expense_date) VALUES ($1, $2, $3, $4)',
        [description, amount, category, date]
      );
      return res.json({ success: true });
    }

    memoryExpenses.push({ id: Date.now(), description, amount, category, expense_date: date });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    if (pool) {
      await pool.query('DELETE FROM expenses WHERE id = $1', [req.params.id]);
      return res.json({ success: true });
    }

    const id = Number(req.params.id);
    const index = memoryExpenses.findIndex(item => item.id === id);
    if (index >= 0) {
      memoryExpenses.splice(index, 1);
    }
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});