const express = require('express');

const router = express.Router();

const cannyController = require('../controllers/canny');

router.post('/post', cannyController.processImage);

module.exports = router;
