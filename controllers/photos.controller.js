const Photo = require('../models/photo.model');
const Voter = require('../models/Voter.model');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  const validateEmail = (emailInput) => {
    const regex = /^[a-zA-Z0–9._-]+@[a-zA-Z0–9.-]+\.[a-zA-Z]{2,4}$/;

    if (emailInput.test(regex)) {
      return true;
    }
    else {
      throw new Error('Wrong input!');
      // res.json('incorrect email');
      // return false;
    }
  }

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;


    // task - validation title and author length
    if (title.length <= 25 && author.length <= 50) {

      if (title && author && email && file) { // if fields are not empty...

        const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
        const fileExt = fileName.split('.').slice(-1)[0];

        // task - validation filetype
        if (fileExt === 'jpg' || fileExt === 'gif' || fileExt === 'png') {
          const newPhoto = new Photo({ title, author, email, src: fileName, votes: 0 });
          await newPhoto.save(); // ...save new photo in DB
          res.json(newPhoto);
        } else {
          throw new Error('Wrong type of file. Please upload an image file (jpg/gif/png).');
        }
      } else {
        throw new Error('Wrong input!');
      }
    } else {
      throw new Error('Max tile length is 25, max author length is 50');
    }

  } catch (err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch (err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {

  try {
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    if (!photoToUpdate) res.status(404).json({ message: 'Not found' });
    else {
      photoToUpdate.votes++;
      photoToUpdate.save();
      res.send({ message: 'OK' });
    }
  } catch (err) {
    res.status(500).json(err);
  }

};