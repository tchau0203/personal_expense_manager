const express = require('express');
const router = express.Router();
const { getExpenses, createExpense, updateExpense, deleteExpense } = require('../controllers/expense.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.get('/',     getExpenses);
router.post('/',    createExpense);
router.put('/:id',  updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
