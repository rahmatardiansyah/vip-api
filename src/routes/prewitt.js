const express = require('express');

const router = express.Router();

const prewittController = require('../controllers/prewitt');

router.post('/post', prewittController.processImage);

module.exports = router;
