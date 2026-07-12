const { createConsumer } = require('../../../../shared/kafka/kafkaClient');
const Notification = require('../models/Notification');

const MESSAGES = {
  'order.created': (p) => `Your order ${p.orderId} has been placed. Total: $${p.totalAmount}`,
  'order.cancelled': (p) => `Your order ${p.orderId} has been cancelled`,
  'inventory.reserved': (p) => `Items for order ${p.orderId} are reserved and ready to ship`,
  'inventory.failed': (p) => `Order ${p.orderId} could not be fulfilled: out of stock`,
  'payment.completed': (p) => `Payment received for order ${p.orderId}. Amount: $${p.amount}`,
  'payment.failed': (p) => `Payment failed for order ${p.orderId}: ${p.reason}`,
};

async function initKafka() {
  await createConsumer(
    'notification-service',
    'notification-service-group',
    ['order.events', 'inventory.events', 'payment.events'],
    async (event) => {
      const builder = MESSAGES[event.eventType];
      if (!builder) return;

      const message = builder(event.payload);
      await Notification.create({
        userId: event.payload.userId,
        orderId: event.payload.orderId,
        channel: 'email',
        type: event.eventType.toUpperCase().replace('.', '_'),
        message,
      });

      // Simulated delivery - swap with real email/SMS provider (SES, Twilio, etc.)
      console.log(`[notification-service] 📧 sent -> ${message}`);
    }
  );
}

module.exports = { initKafka };
