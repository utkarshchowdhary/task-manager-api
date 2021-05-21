const { promisify } = require('util')
const jwt = require('jsonwebtoken')
const User = require('../models/userModel')
const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/AppError')
const { sendWelcomeEmail } = require('../utils/email')

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  })
}

const createSendToken = async (user, statusCode, res) => {
  const token = signToken(user.id)

  user.tokens.push({ token })

  await user.save()

  if (statusCode === 201) {
    sendWelcomeEmail(user.email, user.name)
  }

  res.status(statusCode).json({
    status: 'success',
    token,
    data: user
  })
}

exports.signup = asyncHandler(async (req, res, next) => {
  const user = await User.create(req.body)

  await createSendToken(user, 201, res)
})

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400))
  }

  const user = await User.findOne({ email }).select('+password')

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401))
  }

  await createSendToken(user, 200, res)
})

exports.protect = asyncHandler(async (req, res, next) => {
  const token =
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer') &&
    req.headers.authorization.replace('Bearer ', '')

  if (!token) {
    return next(
      new AppError('You are not logged in! Please login to get access.', 401)
    )
  }

  // Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)

  // Check if user still exists
  const currentUser = await User.findOne({
    _id: decoded.id,
    'tokens.token': token
  })

  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does not exist or You are not logged in!',
        401
      )
    )
  }

  // Check if user changed password after token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('You Recently changed password! Please log in again.', 401)
    )
  }

  req.token = token
  req.user = currentUser
  next()
})

exports.logout = asyncHandler(async (req, res, next) => {
  req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token)

  await req.user.save()

  res.status(200).json({ status: 'success' })
})

exports.logoutAll = asyncHandler(async (req, res, next) => {
  req.user.tokens = []

  await req.user.save()

  res.status(200).json({ status: 'success' })
})

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      )
    }

    next()
  }
}
