const express = require('express')
const morgan = require('morgan')

require('./connect')
const userRouter = require('./routes/userRoutes')
const taskRouter = require('./routes/taskRoutes')
const AppError = require('./utils/AppError')
const globalErrorHandler = require('./controllers/errorController')

// Start express app
const app = express()

app.set('port', process.env.PORT)

// Development Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }))

app.use('/users', userRouter)
app.use('/tasks', taskRouter)

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404))
})

app.use(globalErrorHandler)

module.exports = app
