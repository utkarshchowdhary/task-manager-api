const fs = require('fs');
const { promisify } = require('util');
const multer = require('multer');
const sharp = require('sharp');
const factory = require('./handlerFactory');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const { sendCancelationEmail } = require('../utils/email');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  limits: {
    fileSize: 5000000,
  },
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('avatar');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`src/public/img/users/${req.file.filename}`);

  next();
});

exports.UpdateMe = catchAsync(async (req, res, next) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'email', 'password', 'age'];

  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return next(new AppError('Invalid updates!', 400));
  }

  updates.forEach((update) => (req.user[update] = req.body[update]));

  if (req.file) {
    if (req.user.avatar != 'default.jpg') {
      await promisify(fs.unlink)(`src/public/img/users/${req.user.avatar}`);
    }
    req.user.avatar = req.file.filename;
  }

  await req.user.save();

  res.status(200).json({
    status: 'success',
    data: {
      data: req.user,
    },
  });
});

exports.getMe = catchAsync(async (req, res, next) => {
  await req.user.populate({ path: 'tasks' }).execPopulate();

  res.status(200).json({
    status: 'success',
    data: {
      user: req.user,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await req.user.remove();
  sendCancelationEmail(req.user.email, req.user.name);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead',
  });
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User, { path: 'tasks' });
exports.updateUser = factory.updateOne(User, [
  'name',
  'email',
  'password',
  'age',
]);
exports.deleteUser = factory.deleteOne(User);
