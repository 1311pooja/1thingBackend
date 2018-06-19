const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category');




router.post('/add', categoryController.addCategory);
router.get('/list',categoryController.getAllCategories);

module.exports = router;