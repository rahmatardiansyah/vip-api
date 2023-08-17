const express = require('express');

const router = express.Router();

const logController = require('../controllers/log');

router.post('/post', logController.processImage);

module.exports = router;
