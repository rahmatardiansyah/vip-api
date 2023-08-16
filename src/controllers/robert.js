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

    const grayscaleRGB = await sharp(resizedGrayscaleImage)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const grayscaleRGBArray = [];

    if (grayscaleRGB.info.channels === 4) {
      grayscaleRGB.data.map((item, index) => {
        index++;
        if (index % 4 != 0) grayscaleRGBArray.push(item);
      });
    } else {
      grayscaleRGBArray.push(...grayscaleRGB.data);
    }

    // Robert
    const robertImageData = await sharp(grayscaleImage)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const width = robertImageData.info.width;
    const height = robertImageData.info.height;
    const channel = robertImageData.info.channels;

    const kernelGx = [1, 0, 0, -1];
    const kernelGy = [0, 1, -1, 0];

    const resultImageData = new Uint8Array([...robertImageData.data]);

    for (let i = 0; i < resultImageData.length; i += 4) {
      let gx = 0;
      let gy = 0;
      let x = (i / 4) % width;
      let y = Math.floor(i / 4 / width);
      for (let j = 0; j < 4; j++) {
        let index = ((y + Math.floor(j / 2)) * width + (x + (j % 2))) * 4;

        gx += resultImageData[index] * kernelGx[j];
        gy += resultImageData[index] * kernelGy[j];
      }

      let magnitude = Math.sqrt(gx * gx + gy * gy);
      resultImageData[i] = magnitude;
      resultImageData[i + 1] = magnitude;
      resultImageData[i + 2] = magnitude;
      resultImageData[i + 3] = 255;
    }

    // ubah ke gambar
    await sharp(resultImageData, {
      raw: { width: width, height: height, channels: channel }
    }).toFile(robertImage);

    const Posting = new RobertPost({
      image: image,
      'image-grayscale': grayscaleImage,
      'image-robert': robertImage
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
