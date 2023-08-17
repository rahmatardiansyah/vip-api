const express = require('express');

const router = express.Router();

const robertController = require('../controllers/robert');

router.post('/post', robertController.processImage);

module.exports = router;
