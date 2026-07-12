const { createProducer, publishEvent, createConsumer } = require('../../../../shared/kafka/kafkaClient');
const Order = require('../models/Order');

let producer;

async function initKafka() {
  producer = await createProducer('order-service');

  // Listen for downstream results to update order status (event-driven saga)
  await createConsumer('order-service', 'order-service-group', ['inventory.events', 'payment.events'], async (event) => {
    const { eventType, payload } = event;
    const order = await Order.findById(payload.orderId);
    if (!order) return;

    switch (eventType) {
      case 'inventory.reserved':
        order.status = 'INVENTORY_RESERVED';
        break;
      case 'inventory.failed':
        order.status = 'INVENTORY_FAILED';
        break;
      case 'payment.completed':
        order.status = order.status === 'INVENTORY_FAILED' ? order.status : 'CONFIRMED';
        break;
      case 'payment.failed':
        order.status = 'PAYMENT_FAILED';
        break;
      default:
        return;
    }
    await order.save();
    console.log(`[order-service] order ${order._id} status -> ${order.status}`);
  });
}

async function publishOrderCreated(order) {
  await publishEvent(producer, 'order.events', 'order.created', {
    orderId: order._id.toString(),
    userId: order.userId,
    items: order.items,
    totalAmount: order.totalAmount,
  });
}

async function publishOrderCancelled(order) {
  await publishEvent(producer, 'order.events', 'order.cancelled', {
    orderId: order._id.toString(),
    userId: order.userId,
  });
}

module.exports = { initKafka, publishOrderCreated, publishOrderCancelled };
