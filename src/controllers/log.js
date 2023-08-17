const LogPost = require('../models/log');

const path = require('path');

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

  const logImage = path.join(
    pathInfo.dir,
    `${pathInfo.name}-log${pathInfo.ext}`
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

    const grayscaleRGBArray = []

    grayscaleRGB.data.map((item, index) => {
      index += 1
      if (index % 4 !== 0) grayscaleRGBArray.push(item)

    })

    // Laplacian of Gaussian
    const logImageData = await sharp(grayscaleImage)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const width = logImageData.info.width;
    const height = logImageData.info.height;
    const channel = logImageData.info.channels;

    const gaussianKernel = [
      [0.0625, 0.125, 0.0625],
      [0.125, 0.25, 0.125],
      [0.0625, 0.125, 0.0625]
    ];

    const laplacianKernel = [
      [-1, -1, -1],
      [-1, 8, -1],
      [-1, -1, -1]
    ];

    const result = new Uint8Array([...logImageData.data]);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let sum = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixelIndex = ((y + ky) * width + (x + kx)) * 4;
            const grayValue = logImageData.data[pixelIndex];

            sum += grayValue * gaussianKernel[ky + 1][kx + 1];
          }
        }

        const resultIndex = (y * width + x) * 4;
        result[resultIndex] = sum;
        result[resultIndex + 1] = sum;
        result[resultIndex + 2] = sum;
        result[resultIndex + 3] = 255;
      }
    }

    resultMagnitude = new Uint8Array(result);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let sum = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixelIndex = ((y + ky) * width + (x + kx)) * 4;
            const grayValue = result[pixelIndex];

            sum += grayValue * laplacianKernel[ky + 1][kx + 1];
          }
        }

        const resultIndex = (y * width + x) * 4;
        const magnitude = Math.abs(sum);

        resultMagnitude[resultIndex] = magnitude;
        resultMagnitude[resultIndex + 1] = magnitude;
        resultMagnitude[resultIndex + 2] = magnitude;
        resultMagnitude[resultIndex + 3] = 255;
      }
    }

    await sharp(resultMagnitude, {
      raw: { width: width, height: height, channels: channel }
    }).toFile(logImage);

    const Posting = new LogPost({
      image: image,
      'image-grayscale': grayscaleImage,
      'image-log': logImage
    });

    await Posting.save();

    res.status(201).json({
      message: 'Post Image Sukses',
      data: Posting,
      dataImage: {
        grayscaleRgb: grayscaleRGBArray
      }
    });

  } catch (err) {
    return next(err);
  }

};
