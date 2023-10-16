const SobelPost = require('../models/sobel');

const path = require('path');

const cloudinary = require('./cloudinary');

const sharp = require('sharp');

exports.processImage = async (req, res, next) => {
    if (!req.file) {
        const err = new Error('Image Harus di Upload');
        err.errorStatus = 422;
        return next(err);
    }

    const image = req.file.path;
    const pathInfo = path.parse(image);

    const grayscaleImage = path.join(
        pathInfo.dir,
        `${pathInfo.name}-grayscale${pathInfo.ext}`
    );

    const resizedGrayscaleImage = path.join(
        pathInfo.dir,
        `${pathInfo.name}-resizedGrayscale${pathInfo.ext}`
    );

    const sobelImage = path.join(
        pathInfo.dir,
        `${pathInfo.name}-sobel${pathInfo.ext}`
    );

    try {
        // Grayscale
        await sharp(image).grayscale().toFile(grayscaleImage);

        // resized
        await sharp(grayscaleImage).resize(7, 7).toFile(resizedGrayscaleImage);

        const grayscaleRGB = await sharp(resizedGrayscaleImage)
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

        const grayscaleRGBArray = [];

        grayscaleRGB.data.map((item, index) => {
            index += 1;
            if (index % 4 !== 0) grayscaleRGBArray.push(item);
        });

        // sobel
        const sobelImageData = await sharp(grayscaleImage)
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

        const width = sobelImageData.info.width;
        const height = sobelImageData.info.height;
        const channel = sobelImageData.info.channels;

        const horizontalKernel = [
            [-1, 0, 1],
            [-2, 0, 2],
            [-1, 0, 1],
        ];

        const verticalKernel = [
            [-1, -2, -1],
            [0, 0, 0],
            [1, 2, 1],
        ];

        const resultMagnitude = new Uint8Array([...sobelImageData.data]);

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let sumHorizontal = 0;
                let sumVertical = 0;

                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const pixelIndex = ((y + ky) * width + (x + kx)) * 4;
                        const grayValue = sobelImageData.data[pixelIndex];

                        sumHorizontal +=
                            grayValue * horizontalKernel[ky + 1][kx + 1];
                        sumVertical +=
                            grayValue * verticalKernel[ky + 1][kx + 1];
                    }
                }

                const resultIndex = (y * width + x) * 4;
                const magnitude = Math.sqrt(
                    sumHorizontal ** 2 + sumVertical ** 2
                );

                resultMagnitude[resultIndex] = magnitude;
                resultMagnitude[resultIndex + 1] = magnitude;
                resultMagnitude[resultIndex + 2] = magnitude;
                resultMagnitude[resultIndex + 3] = 255;
            }
        }

        await sharp(resultMagnitude, {
            raw: { width: width, height: height, channels: channel },
        }).toFile(sobelImage);

        const imageUpload = [image, grayscaleImage, sobelImage];

        const uploadedUrls = [];

        await (async function run() {
            for (const i of imageUpload) {
                const result = await cloudinary.uploader.upload(i, {
                    folder: 'VIP/Temp',
                });
                uploadedUrls.push(result.secure_url);
            }
        })();

        const [imageURL, grayscaleImageURL, sobelImageURL] = uploadedUrls;

        const Posting = new SobelPost({
            image: imageURL,
            'image-grayscale': grayscaleImageURL,
            'image-sobel': sobelImageURL,
        });

        await Posting.save();

        res.status(201).json({
            message: 'Post Image Sukses',
            data: Posting,
            dataImage: {
                grayscaleRgb: grayscaleRGBArray,
            },
        });
    } catch (err) {
        return next(err);
    }
};
