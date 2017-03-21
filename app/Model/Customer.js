'use strict'

const mongoose = use('Mongoose')

const customerSchema = mongoose.Schema({
  name: String,
  email: String,
  synced: {
    type: Boolean,
    default: false
  },
  created: {
    type: Date,
    default: Date.now
  }
})

const Customer = mongoose.model('Customer', customerSchema)

module.exports = Customer
