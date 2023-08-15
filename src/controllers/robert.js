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

  const robertImage = path.join(
    pathInfo.dir,
    `${pathInfo.name}-robert${pathInfo.ext}`
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

    const grayscaleRGBArray = [];

    if (grayscaleRGB.info.channels === 4) {
      let index = 1;
      grayscaleRGB.data.map(item => {
        if (index % 4 != 0) grayscaleRGBArray.push(item);
        index++;
      });
    } else {
      grayscaleRGBArray.push(grayscaleRGB.data);
    }

    console.log(grayscaleRGB.info.channels);

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
