const RobertPost = require('../models/robert');
const path = require('path');
const fs = require('fs');

exports.uploadImage = (req, res, next) => {
  if (!req.file) {
    const err = new Error('Image Harus di Upload');
    err.errorStatus = 422;
    throw err;
  }

  // req
  const image = req.file.path;

  const Posting = new RobertPost({
    image: image
  });

  // Jika berhasil
  Posting.save()
    .then(result => {
      res.status(201).json({
        message: 'Post Image Sukses',
        data: result
      });
    })
    .catch(err => {
      console.log(err);
    });
};
