const Task = require('../models/taskModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.createTask = catchAsync(async (req, res, next) => {
  const task = await Task.create({ ...req.body, owner: req.user._id });

  res.status(201).json({
    status: 'success',
    data: {
      data: task,
    },
  });
});

exports.getAllTasks = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Task.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const tasks = await features.query.find({ owner: req.user._id });

  if (!tasks) {
    return next(new AppError('No documents found!', 404));
  }

  res.status(200).json({
    status: 'success',
    results: tasks.length,
    data: {
      data: tasks,
    },
  });
});

exports.getTask = catchAsync(async (req, res, next) => {
  const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });

  if (!task) {
    return next(new AppError('No document found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      data: task,
    },
  });
});

exports.updateTask = catchAsync(async (req, res, next) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['description', 'completed'];

  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return next(new AppError('Invalid updates!', 400));
  }

  const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });

  if (!task) {
    return next(new AppError('No document found with that ID', 404));
  }

  updates.forEach((update) => (task[update] = req.body[update]));

  await task.save();

  res.status(200).json({
    status: 'success',
    data: {
      data: task,
    },
  });
});

exports.deleteTask = catchAsync(async (req, res, next) => {
  const task = await Task.findOneAndDelete({
    _id: req.params.id,
    owner: req.user._id,
  });

  if (!task) {
    return next(new AppError('No document found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
