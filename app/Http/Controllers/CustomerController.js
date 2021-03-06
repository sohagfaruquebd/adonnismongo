'use strict'

const Customer = use('App/Model/Customer')
const AgentCustomer = use('App/Model/AgentCustomer')
const Appointment = use('App/Model/Appointment')

class CustomerController {

  * index (req, res) {
    const customers = yield Customer.find().exec()
    res.send(customers)
  }

  * show (req, res) {
    const id = req.param('id')
    const customer = yield Customer.findOne({ _id: id }).exec()
    res.send(customer)
  }
  /**
   * Create Customer
   */
  * store (req, res) {
    const obj = req.only('name', 'email', 'phone', 'address1', 'address2', 'city', 'zipCode', 'state', 'country')
    let customer = yield Customer.findOne({ email: obj.email }).exec()
    if (!customer) {
      customer = yield Customer.create(obj)
    }
    res.send(customer)
  }

  * update (req, res) {
    const id = req.param('id')
    const obj = req.only('name', 'email', 'phone', 'address1', 'address2', 'city', 'zipCode', 'state', 'country')
    const customer = yield Customer.update({ _id: id }, { name: obj.name, email: obj.email, phone: obj.phone, address1: obj.address1, address2: obj.address2, city: obj.city, zipCode: obj.zipCode, state: obj.state }).exec()
    res.send(customer)
  }

  * destroy (req, res) {
    const id = req.param('id')
    const agentId = req.input('agent')
    if (!agentId) {
      yield Customer.deleteOne({ _id: id })
      yield AgentCustomer.remove({ customer: id })
      yield Appointment.remove({ customer: id })
    } else {
      yield AgentCustomer.remove({ agent: agentId, customer: id })
      yield Appointment.remove({ agent: agentId, customer: id })
    }
    res.ok()
  }

  * import (req, res) {
    res.ok()
  }

  /**
   * Search Customer by Name, Zip Code, City
   */
  * search (req, res) {
    let search = req.input('key')
    let agent = req.input('agent')
    let excludeAgent = req.input('excl')
    search = search || ''
    const role = req.currentUser.role.name
    let existingCustomer = {}
    if (agent && role === 'Agent') {
      const id = agent || req.currentUser._id
      const agents = yield AgentCustomer.find({ agent: id }, 'customer').exec()
      const cids = agents.map((c) => {
        return c.customer
      })
      if (excludeAgent && excludeAgent === '1') {
        existingCustomer = { _id: { $nin: cids } }
      } else {
        existingCustomer = { _id: { $in: cids } }
      }
    }
    console.log(existingCustomer)

    let regex = new RegExp(search, 'i')
    const customers = yield Customer
      .find()
      .and([
        existingCustomer,
        { $or: [{ name: regex }, { email: regex }, { zipCode: search }, { city: regex }] }
      ])
      .exec()

    res.ok(customers)
  }
}

module.exports = CustomerController
