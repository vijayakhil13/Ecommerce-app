const axios = require('axios');
const { createProducer, publishEvent, createConsumer } = require('../../shared/kafka/kafkaClient');
const Payment = require('../models/Payment');

let producer;
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:4004';

// Simulated payment gateway call (swap with Stripe/Razorpay SDK in production)
function simulateGatewayCharge(amount) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const success = Math.random() > 0.05; // ~95% success rate
      resolve({
        success,
        transactionRef: success ? `txn_${Date.now()}` : null,
        reason: success ? null : 'Card declined by simulated gateway',
      });
    }, 800);
  });
}

async function initKafka() {
  producer = await createProducer('payment-service');

  await createConsumer('payment-service', 'payment-service-group', ['inventory.events'], async (event) => {
    if (event.eventType !== 'inventory.reserved') return; // only charge once stock is confirmed
    const { orderId } = event.payload;

    try {
      const { data } = await axios.get(`${ORDER_SERVICE_URL}/internal/${orderId}`);
      const order = data.order;

      const result = await simulateGatewayCharge(order.totalAmount);

      const payment = await Payment.create({
        orderId,
        userId: order.userId,
        amount: order.totalAmount,
        method: 'card',
        status: result.success ? 'SUCCESS' : 'FAILED',
        transactionRef: result.transactionRef,
        failureReason: result.reason,
      });

      if (result.success) {
        await publishEvent(producer, 'payment.events', 'payment.completed', {
          orderId,
          paymentId: payment._id.toString(),
          amount: order.totalAmount,
        });
      } else {
        await publishEvent(producer, 'payment.events', 'payment.failed', {
          orderId,
          paymentId: payment._id.toString(),
          reason: result.reason,
        });
      }
    } catch (err) {
      await publishEvent(producer, 'payment.events', 'payment.failed', { orderId, reason: err.message });
    }
  });
}

module.exports = { initKafka };
