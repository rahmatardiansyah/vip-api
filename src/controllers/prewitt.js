const PrewittPost = require('../models/prewitt');
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

  const prewittImage = path.join(
    pathInfo.dir,
    `${pathInfo.name}-prewitt${pathInfo.ext}`
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

    // Prewitt
    const prewittImageData = await sharp(grayscaleImage)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const width = prewittImageData.info.width;
    const height = prewittImageData.info.height;
    const channel = prewittImageData.info.channels;

    const horizontalKernel = [
      [-1, 0, 1],
      [-1, 0, 1],
      [-1, 0, 1]
    ];

    const verticalKernel = [
      [-1, -1, -1],
      [0, 0, 0],
      [1, 1, 1]
    ];

    const resultMagnitude = new Uint8Array([...prewittImageData.data]);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let sumHorizontal = 0;
        let sumVertical = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixelIndex = ((y + ky) * width + (x + kx)) * 4;
            const grayValue = prewittImageData.data[pixelIndex];

            sumHorizontal += grayValue * horizontalKernel[ky + 1][kx + 1];
            sumVertical += grayValue * verticalKernel[ky + 1][kx + 1];
          }
        }

        const resultIndex = (y * width + x) * 4;
        const magnitude = Math.sqrt(sumHorizontal ** 2 + sumVertical ** 2);

        resultMagnitude[resultIndex] = magnitude;
        resultMagnitude[resultIndex + 1] = magnitude;
        resultMagnitude[resultIndex + 2] = magnitude;
        resultMagnitude[resultIndex + 3] = 255;
      }
    }

    await sharp(resultMagnitude, {
      raw: { width: width, height: height, channels: channel }
    }).toFile(prewittImage);

    const Posting = new PrewittPost({
      image: image,
      'image-grayscale': grayscaleImage,
      'image-prewitt': prewittImage
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
