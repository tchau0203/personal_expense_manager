const express = require('express');
const router = express.Router();
const { getBudgets, createBudget, updateBudget, deleteBudget } = require('../controllers/budget.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.get('/',       getBudgets);
router.post('/',      createBudget);
router.put('/:id',    updateBudget);
router.delete('/:id', deleteBudget);

module.exports = router;
