const jwt = require('jsonwebtoken');
const User = require('../models/user');

auth = async function (req, res, next) {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    //
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    //_id, ObjectId

    const user = await User.findOne({
      _id: decoded._id,
      'tokens.token': token,
    });

    if (!user) throw new Error();
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    //
    //res.status(401).send(error);
    res.status(401).send({ error: 'Please authenticate!' });
  }
};

module.exports = auth;
