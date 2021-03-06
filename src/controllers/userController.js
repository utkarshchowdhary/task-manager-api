const multer = require('multer')
const sharp = require('sharp')
const factory = require('./handlerFactory')
const User = require('../models/userModel')
const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/AppError')
const { sendCancelationEmail } = require('../utils/email')

const multerStorage = multer.memoryStorage()

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true)
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false)
  }
}

const upload = multer({
  limits: {
    fileSize: 5000000
  },
  storage: multerStorage,
  fileFilter: multerFilter
})

exports.initiateUpload = upload.single('avatar')

exports.resizeAvatar = asyncHandler(async (req, res, next) => {
  if (!req.file) return next()

  req.file.buffer = await sharp(req.file.buffer)
    .resize(500, 500)
    .png()
    .toBuffer()

  next()
})

exports.uploadAvatar = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please select an image to upload', 400))
  }
  if (req.params.id) {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { avatar: req.file.buffer },
      {
        new: true,
        runValidators: true
      }
    )
    if (!user) {
      return next(new AppError('No user found with that ID', 404))
    }
  } else {
    req.user.avatar = req.file.buffer
    await req.user.save()
  }
  res.status(200).json({
    status: 'success'
  })
})

exports.getAvatar = asyncHandler(async (req, res, next) => {
  if (req.params.id) {
    const user = await User.findById(req.params.id)
    if (!user || !user.avatar) {
      return next(new AppError('No user/avatar found with that ID', 404))
    }
    res.set('Content-Type', 'image/png')
    res.send(user.avatar)
  } else {
    if (!req.user.avatar) {
      return next(new AppError('No avatar associated with the user', 404))
    }
    res.set('Content-Type', 'image/png')
    res.send(req.user.avatar)
  }
})

exports.deleteAvatar = asyncHandler(async (req, res, next) => {
  if (req.params.id) {
    const user = await User.findById(req.params.id)
    if (!user) {
      return next(new AppError('No user found with that ID', 404))
    }
    user.avatar = undefined
    await user.save()
  } else {
    req.user.avatar = undefined
    await req.user.save()
  }
  res.status(200).json({
    status: 'success'
  })
})

exports.updateMe = asyncHandler(async (req, res, next) => {
  const updates = Object.keys(req.body)
  const allowedUpdates = ['name', 'email', 'password', 'age']

  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  )

  if (!isValidOperation) {
    return next(new AppError('Invalid updates!', 400))
  }

  updates.forEach((update) => (req.user[update] = req.body[update]))

  await req.user.save()

  res.status(200).json({
    status: 'success',
    data: req.user
  })
})

exports.getMe = asyncHandler(async (req, res, next) => {
  await req.user.populate({ path: 'tasks' }).execPopulate()

  res.status(200).json({
    status: 'success',
    data: req.user
  })
})

exports.deleteMe = asyncHandler(async (req, res, next) => {
  await req.user.remove()
  sendCancelationEmail(req.user.email, req.user.name)

  res.status(204).json({
    status: 'success',
    data: null
  })
})

exports.createUser = factory.createOne(User)

exports.getAllUsers = factory.getAll(User)

exports.getUser = factory.getOne(User, { path: 'tasks' })

exports.updateUser = factory.updateOne(User, [
  'name',
  'email',
  'password',
  'age'
])

exports.deleteUser = factory.deleteOne(User)
