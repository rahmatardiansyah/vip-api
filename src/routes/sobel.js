const express = require('express');

const router = express.Router();

const sobelController = require('../controllers/sobel');

router.post('/post', sobelController.processImage);

module.exports = router;
