'use strict'

/**
 *  @var Mongoose mongoose
 */
const mongoose = use('Mongoose')
const Hash = use('Hash')
const userSchema = mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true
  },
  phone: String,
  password: String,
  role: {
    type: 'ObjectId',
    ref: 'Role'
  },
  address: String,
  city: String,
  zipCode: [String],
  state: String,
  country: String,
  block_time: String,
  reset_token: String,
  reset_exp: Date,
  photo: String,
  email_confirmed: {
    type: Boolean,
    default: false
  },
  confirm_date: Date,
  created: {
    type: Date,
    default: Date.now
  }
})

userSchema.pre('save', async function (next) {
  if (this.password) {
    this.password = await Hash.make(this.password)
  }
  return next(true)
})

const User = mongoose.model('User', userSchema)
User.ensureIndexes()

module.exports = User
