const asyncHandler = require('../utils/asyncHandler')
const AppError = require('../utils/AppError')
const Features = require('../utils/Features')

exports.deleteOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    const doc = await Model.findById(req.params.id)

    if (!doc) {
      return next(new AppError('No document found with that ID', 404))
    }

    await doc.remove()

    res.status(204).json({
      status: 'success',
      data: null
    })
  })

exports.updateOne = (Model, allowedUpdates) =>
  asyncHandler(async (req, res, next) => {
    const updates = Object.keys(req.body)

    const isValidOperation = updates.every((update) =>
      allowedUpdates.includes(update)
    )

    if (!isValidOperation) {
      return next(new AppError('Invalid updates!', 400))
    }

    const doc = await Model.findById(req.params.id)

    if (!doc) {
      return next(new AppError('No document found with that ID', 404))
    }

    updates.forEach((update) => (doc[update] = req.body[update]))

    await doc.save()

    res.status(200).json({
      status: 'success',
      data: doc
    })
  })

exports.createOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    const doc = await Model.create(req.body)

    res.status(201).json({
      status: 'success',
      data: doc
    })
  })

exports.getOne = (Model, popOptions) =>
  asyncHandler(async (req, res, next) => {
    let query = Model.findById(req.params.id)
    if (popOptions) query = query.populate(popOptions)
    const doc = await query

    if (!doc) {
      return next(new AppError('No document found with that ID', 404))
    }

    res.status(200).json({
      status: 'success',
      data: doc
    })
  })

exports.getAll = (Model) =>
  asyncHandler(async (req, res, next) => {
    const features = new Features(Model.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate()
    const docs = await features.query

    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: docs
    })
  })
