const RobertPost = require('../models/robert');
const path = require('path');

const sharp = require('sharp');

exports.uploadImage = async (req, res, next) => {
  if (!req.file) {
    const err = new Error('Image Harus di Upload');
    err.errorStatus = 422;
    return next(err);
  }

  const image = req.file.path;
  const pathInfo = path.parse(image);
  const resizeImage = path.join(
    pathInfo.dir,
    `${pathInfo.name}-resized${pathInfo.ext}`
  );

  const grayscaleImage = path.join(
    pathInfo.dir,
    `${pathInfo.name}-grayscale${pathInfo.ext}`
  );

  try {
    await sharp(image).resize(7, 7).toFile(resizeImage);

    const originalRGB = await sharp(resizeImage)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const originalRGBArray = Array.from(originalRGB.data);

    const Posting = new RobertPost({
      image: image
    });

    await Posting.save();

    await sharp(resizeImage).grayscale().toFile(grayscaleImage);

    const grayscaleRGB = await sharp(grayscaleImage)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const grayscaleRGBArray = Array.from(grayscaleRGB.data);

    res.status(201).json({
      message: 'Post Image Sukses',
      dataImage: {
        originalRgb: originalRGBArray,
        grayscaleRgb: grayscaleRGBArray
      }
    });
  } catch (err) {
    return next(err);
  }
};
