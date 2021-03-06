'use strict'

const Appointment = use('App/Model/Appointment')
const User = use('App/Model/User')
const Customer = use('App/Model/Customer')
const Supplies = use('App/Model/Supplies')
const moment = require('moment')
const Mail = use('Mail')
class AppointmentController {
  * show (req, res) {
    const id = req.input('id')
    const appointment = yield Appointment.findOne(id).populate('agent', 'name email').populate('customer', 'name email address1 address2 city state zipCode').exec()
    res.send(appointment)
  }
  /**
   * Fetch appointment by agent
   */
  * byAgent (req, res) {
    let agentId = req.param('id')
    if (agentId === 'me') {
      agentId = req.currentUser._id
    }
    const appointments = yield Appointment.find({ agent: agentId }).populate('agent', 'name email').populate('customer', 'name email address1 address2 city state zipCode country').exec()
    res.send(appointments)
  }
  /**
   * Fetch appointment by customer
   */
  * byCustomer (req, res) {
    const customerId = req.param('id')
    const appointments = yield Appointment.find({ customer: customerId }).populate('agent', 'name email').populate('customer', 'name email address1 address2 city state zipCode country').exec()
    res.send(appointments)
  }

  /**
   * Save appointment for agent
   * @param {customer} customer email
   * @param {agent} agent email
   */
  * store (req, res) {
    const customerId = req.input('customer')
    const agentId = req.input('agent')
    const start = req.input('start')
    let startDateTime = moment(start).format('MMMM Do YYYY h:mm A')
    const comment = req.input('comment')
    const description = req.input('description')
    const grouponcode = req.input('grouponcode')
    const id = req.input('_id')

    const agent = yield User.findOne({ email: agentId }).exec()
    if (!agent) {
      return res.send('Agent not Found')
    }
    const customer = yield Customer.findOne({ email: customerId }).exec()
    if (!customer) {
      return res.send('Customer not Found')
    }
    let appointment
    if (id) {
      yield Appointment.update({ _id: id }, { customer, agent, start_time: start, description, comment, grouponcode })
      appointment = yield Appointment.findOne({ _id: id }).populate('customer').exec()
    } else {
      appointment = yield Appointment.create({ customer, agent, grouponcode, start_time: start, description, comment })
      yield Mail.raw('', message => {
        message.to(agentId, agentId)
        message.from('no-reply@backportal.com')
        message.subject('You have a new appointment')
        message.html(`Hello ${agent.name},<br> <p>You have a new scanning appointment from the Back Portal: <br/><b>Customer information<b/>
        <br/>Customer name: ${customer.name}<br/>Customer address: ${customer.address1}<br/>Customer phone: ${customer.phone}
        <br/>Customer email: ${customer.email}<br/>Appointment start date: ${startDateTime}</p>`)
      })
    }

    res.send(appointment)
  }

  /**
   * Delete a appointment
   */
  * destroy (req, res) {
    const id = req.param('id')
    try {
      yield Appointment.deleteOne({ _id: id })
      res.ok()
    } catch (e) {
      res.send(e)
    }
  }

  * startAppointment (req, res) {
    const id = req.input('_id')
    const start = req.input('start')
    yield Appointment.update({ _id: id }, { watchStatus: 1, started: start })
    res.ok('Started')
  }
  * pauseAppointment (req, res) {
    const id = req.input('_id')
    const paused = req.input('paused')
    const start = req.input('start')
    const totalDiff = req.input('total')

    yield Appointment.update({ _id: id }, { watchStatus: paused, started: start, totalDiff })
    res.ok('Activated')
  }

  * stopAppointment (req, res) {
    const id = req.input('_id')
    const end = req.input('end')
    const distance = req.input('totalDiff')

    const title = 'Scanning Appointment'


    let minutes = Math.floor(distance / (1000 * 60))
    // let minutes = Math.floor(distance / 1000)
    let remaining = minutes < 120 ? 0 : (minutes - 120)
    let quarter = Math.ceil(remaining / 15)
    let supplyTitle = '2 Hour Scanning'
    let supplyTitleQuarter = 'Scanning 1/4 Hour'
    let hourScanning = yield Supplies.findOne({ name: supplyTitle }).exec()
    let quarterHourScanning = yield Supplies.findOne({ name: supplyTitleQuarter }).exec()
    let items = [{
      description: '2 Hour Scanning',
      price: 170,
      quantity: 1,
      commission: 100
    }]

    if (hourScanning) {
      items = [{
        description: hourScanning.name,
        price: hourScanning.price,
        quantity: 1,
        commission: hourScanning.commission
      }]
    }

    if (quarter > 0) {
      if (quarterHourScanning) {
        items.push({
          description: quarterHourScanning.name,
          price: quarterHourScanning.price,
          quantity: quarter,
          commission: quarterHourScanning.commission
        })
      } else {
        items.push({
          description: 'Scanning 1/4 Hour',
          price: 21.25,
          quantity: quarter,
          commission: 100
        })
      }
    }
    yield Appointment.update({ _id: id }, { watchStatus: 3, totalDiff: distance, ended: end, invoice_title: title, items, invoice_date: new Date(), invoice_settled: false })

    res.ok('Stopped')
  }
}

module.exports = AppointmentController
