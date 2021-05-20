const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Please provide your name!']
    },
    email: {
      type: String,
      required: [true, 'Please provide your email!'],
      unique: true,
      trim: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Please provide your password!'],
      minlength: 8,
      select: false,
      validate: {
        validator: function (val) {
          return !val.toLowerCase().includes('password')
        },
        message: 'Password cannot contain "password"!'
      }
    },
    age: {
      type: Number,
      default: 0,
      validate: {
        validator: function (val) {
          return val >= 0
        },
        message: 'Age must be a positive number!'
      }
    },
    avatar: {
      type: Buffer,
      select: false
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'admin'],
        message: 'Role is either: user or admin'
      },
      default: 'user'
    },
    tokens: [
      {
        token: {
          type: String,
          required: true
        }
      }
    ],
    passwordChangedAt: { type: Date }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (doc, ret) => {
        delete ret._id
        delete ret.password
        delete ret.tokens
        delete ret.avatar
      }
    },
    toObject: {
      virtuals: true,
      versionKey: false,
      transform: (doc, ret) => {
        delete ret._id
        delete ret.password
        delete ret.tokens
        delete ret.avatar
      }
    }
  }
)

// Virtual populate
userSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'owner'
})

// Hash the plain text password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()

  this.password = await bcrypt.hash(this.password, 12)

  next()
})

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next()

  this.passwordChangedAt = Date.now()
  next()
})

// Instance Method
userSchema.methods.correctPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

userSchema.methods.changedPasswordAfter = function (JWTIssuedAt) {
  if (this.passwordChangedAt) {
    return JWTIssuedAt < parseInt(this.passwordChangedAt.getTime() / 1000)
  }
  return false
}

// Delete user tasks when user is removed
userSchema.pre('remove', async function (next) {
  await this.model('Task').deleteMany({ owner: this.id })
  next()
})

const User = mongoose.model('User', userSchema)

module.exports = User
