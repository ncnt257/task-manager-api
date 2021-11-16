const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
//const { ObjectId } = require('mongodb');
const User = require('../models/user');
const auth = require('../middleware/auth');
const { sendWelcomeEmail, sendCancelEmail } = require('../emails/account');

const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|JPG|JPEG|PNG)$/)) {
      return cb(new Error('Please upload image file'));
    }
    cb(undefined, true);
  },
});

const router = new express.Router();

//login
router.post('/users/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (error) {
    res.status(400).send(error.message);
  }
});

//logout
router.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => {
      token.token !== req.token;
    });
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send(error.message);
  }
});
//logoutall
router.post('/users/logoutAll', auth, async (req, res) => {
  //
  try {
    req.user.tokens.splice(0);
    await req.user.save();
    res.send(req.user);
  } catch (error) {
    res.status(500).send(error.message);
  }
});
//signup
router.post('/users', async (req, res) => {
  const user = new User(req.body);

  try {
    await user.save();
    sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e.message);
  }
});

//getprofile    
router.get('/users/me', auth, async (req, res) => {
  res.send(req.user);
});

//deprecated
// router.get('/users/:id', async (req, res) => {
//   const _id = req.params.id;
//   if (!ObjectId.isValid(_id)) return res.status(400).send();
//   try {
//     const user = await User.findById(_id);
//     if (!user) {
//       return res.status(404).send();
//     }
//     res.send(user);
//   } catch (e) {
//     res.status(500).send();
//   }
// });
//updateprofile
router.patch('/users/me', auth, async (req, res) => {
  //deprecated
  //if (!ObjectId.isValid(req.params.id)) return res.status(400).send();

  const updates = Object.keys(req.body);
  //const allowedUpdates=Object.keys(User)
  const allowedUpdates = ['name', 'email', 'password', 'age'];
  const isValidUpdates = updates.every(prop => allowedUpdates.includes(prop));
  if (!isValidUpdates) return res.status(400).send({ error: 'Invalid update' });

  try {
    updates.forEach(update => (req.user[update] = req.body[update]));
    await req.user.save();
    res.send(req.user);
    // const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    //   new: true,
    //   runValidators: true,
    // });
  } catch (error) {
    res.status(400).send(error.message);
  }
});
//deleteprofile
router.delete('/users/me', auth, async (req, res) => {
  //deprecated
  // if (!ObjectId.isValid(req.params.id)) return res.status(400).send();
  try {
    console.log(req.user);
    await req.user.remove();
    sendCancelEmail(req.user.email, req.user.name);
    res.send(req.user);
  } catch (error) {
    res.status(500).send;
  }
});

router.post(
  '/users/me/avatar',
  auth,
  upload.single('avatar'),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send(req.user);
  },
  (err, req, res, next) => {
    res.status(400).send({ error: err.message });
  }
);

router.delete('/users/me/avatar', auth, async (req, res) => {
  try {
    req.user.avatar = null;
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send;
  }
});

router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.avatar) return res.status(404).send();

    res.set('Content-Type', 'image/png');
    res.send(user.avatar);
  } catch (error) {
    res.status(500).send();
  }
});

module.exports = router;
