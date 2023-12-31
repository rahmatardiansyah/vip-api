const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const app = express();
const fs = require('fs');
const path = require('path');
const nodeCron = require('node-cron');

const { deleteImage } = require('./src/controllers/delImgCloudinary');

const dotenv = require('dotenv');
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

try {
    if (fs.existsSync('/tmp/vip-images')) {
        fs.rmSync('/tmp/vip-images', { recursive: true, force: true });
    }
    fs.mkdirSync('/tmp/vip-images');
} catch (err) {
    console.error(err);
}

const robertRoutes = require('./src/routes/robert');
const prewittRoutes = require('./src/routes/prewitt');
const sobelRoutes = require('./src/routes/sobel');
const logRoutes = require('./src/routes/log');
const cannyRoutes = require('./src/routes/canny');

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '/tmp/vip-images');
    },
    filename: (req, file, cb) => {
        const ext = file.originalname.split('.').pop();
        cb(null, new Date().getTime() + `.${ext}`);
    },
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

app.use('/image', express.static('/tmp/vip-images'));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(
    multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
);

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    );
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization'
    );
    next();
});

app.use('/v1/robert', robertRoutes);
app.use('/v1/prewitt', prewittRoutes);
app.use('/v1/sobel', sobelRoutes);
app.use('/v1/log', logRoutes);
app.use('/v1/canny', cannyRoutes);

app.use((error, req, res, next) => {
    const status = error.errorStatus || 500; // defaultnya error 500
    const massage = error.message;
    const data = error.data;

    res.status(status).json({ message: massage, data: data });
});

nodeCron.schedule('*/5 * * * *', deleteImage);

const port = process.env.PORT || 3000;
mongoose
    .connect(process.env.MONGO)
    .then(() => {
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
    .catch((err) => {
        console.log(err);
    });
