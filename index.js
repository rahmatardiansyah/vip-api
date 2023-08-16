const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const app = express();
const fs = require('fs');
require('dotenv').config();

// try {
//   if (!fs.existsSync('./gambar')) {
//     fs.mkdirSync('./gambar');
//   }
// } catch (err) {
//   console.error(err);
// }

const robertRoutes = require('./src/routes/robert');

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/tmp');
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop();
    cb(null, new Date().getTime() + `.${ext}`);
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

app.use('/tmp', express.static(path.join(__dirname, 'tmp')));
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
);

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
