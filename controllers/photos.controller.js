const Photo = require('../models/photo.model');
const Voter = require('../models/Voter.model');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  const escape = (html) => {
    return html
      .replace(/&/g, '')
      .replace(/</g, '')
      .replace(/>/g, '')
      .replace(/"/g, '')
      .replace(/'/g, '');
  };

  const validateEmail = (emailInput) => {
    const regex = new RegExp(/^[a-zA-Z0–9._-]+@[a-zA-Z0–9.-]+\.[a-zA-Z]{2,4}$/);
    return regex.test(emailInput);
  };

  try {
    let { title, author, email } = req.fields;
    title = escape(title);
    author = escape(author);
    const file = req.files.file;

    // task - validation title and author length
    if (title.length > 25 && author.length > 50) return res.status(400).json({ message: 'bad request' });

    if (title && author && email && file && validateEmail(email)) { // if fields are not empty...
      // if (title && author && email && file) { // if fields are not empty...

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExt = fileName.split('.').slice(-1)[0];

      // task - validation filetype
      if (fileExt === 'jpg' || fileExt === 'gif' || fileExt === 'png') {
        const newPhoto = new Photo({
          title,
          author,
          email,
          src: fileName,
          votes: 0
        });
        await newPhoto.save(); // ...save new photo in DB
        res.json(newPhoto);
      } else {
        return res.status(400).json({ message: 'Wrong type of file. Please upload an image file (jpg/gif/png).' });
      }
    } else {
      return res.status(400).json({ message: 'wrong input' });
    }
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
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

const addVote = async (res, photoToUpdate) => {
  try {
    photoToUpdate.votes++;
    await photoToUpdate.save();
    res.send({ message: 'OK' });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

exports.vote = async (req, res) => {

  try {
    const voter = await Voter.findOne({ user: req.ip });
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    if (!photoToUpdate) {
      res.status(404).json({ message: 'Not found' });
      return;
    };
    if (!voter) {
      const voter = new Voter({ user: req.ip, votes: [photoToUpdate._id] });
      await voter.save();
      await addVote(res, photoToUpdate);
    }
    // check if voter already voted for this picture, if not add this vote to array of votes
    else if (!voter.votes.includes(photoToUpdate._id)) {
      voter.votes.push(photoToUpdate._id);
      await voter.save();
      await addVote(res, photoToUpdate);
    }
    // if voter has already voted for picture, return status
    else {
      res.status(400).json({ message: 'You\'ve already voted for this photo.' });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};