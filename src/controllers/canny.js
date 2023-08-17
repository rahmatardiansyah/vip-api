const CannyPost = require('../models/canny');

const path = require('path');

const sharp = require('sharp');
const { Image } = require('image-js');

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

  const cannyImage = path.join(
    pathInfo.dir,
    `${pathInfo.name}-canny${pathInfo.ext}`
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

    // Canny Image Detection
    const img = await Image.load(image);
    await img.grey().cannyEdge().save(cannyImage);

    const Posting = new CannyPost({
      image: image,
      'image-grayscale': grayscaleImage,
      'image-canny': cannyImage
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
