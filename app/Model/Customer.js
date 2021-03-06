'use strict'

const mongoose = use('Mongoose')

const customerSchema = mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  address1: String,
  address2: String,
  city: String,
  state: String,
  zipCode: String,
  country: {
    type: String,
    default: 'United States'
  },
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
