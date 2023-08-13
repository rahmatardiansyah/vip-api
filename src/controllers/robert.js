const RobertPost = require('../models/robert');
const path = require('path');
const fs = require('fs');

const sharp = require('sharp');

exports.uploadImage = async (req, res, next) => {
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

  try {
    // Grayscale
    await sharp(image).grayscale().toFile(grayscaleImage);

    // resized
    await sharp(grayscaleImage).resize(7, 7).toFile(resizedGrayscaleImage);

    const Posting = new RobertPost({
      image: image,
      'image-grayscale': grayscaleImage
    });

    await Posting.save();

    const grayscaleRGB = await sharp(resizedGrayscaleImage)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const grayscaleRGBArray = Array.from(grayscaleRGB.data);

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
