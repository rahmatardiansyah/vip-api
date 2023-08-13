const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const app = express();

require('dotenv').config();

const robertRoutes = require('./src/routes/robert');

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/tmp/vip-images');
    // cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, new Date().getTime() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    // jika sukses terpenuhi kirim null dan true
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
);
// app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use('/v1/robert', robertRoutes);

app.use((error, req, res, next) => {
  const status = error.errorStatus || 500; // defaultnya error 500
  const massage = error.message;
  const data = error.data;

  res.status(status).json({ message: massage, data: data });
});

mongoose
  .connect(process.env.MONGO)
  .then(() => {
    app.listen(3000, () => {
      console.log('Connection Success!!!');
    });
  })
  .catch(err => {
    console.log(err);
  });
