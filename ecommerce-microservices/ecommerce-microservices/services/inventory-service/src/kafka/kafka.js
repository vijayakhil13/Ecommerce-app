const axios = require('axios');
const { createProducer, publishEvent, createConsumer } = require('../../../../shared/kafka/kafkaClient');
const Reservation = require('../models/Reservation');

let producer;
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:4003';

async function initKafka() {
  producer = await createProducer('inventory-service');

  await createConsumer('inventory-service', 'inventory-service-group', ['order.events'], async (event) => {
    if (event.eventType !== 'order.created') return;
    const { orderId, items } = event.payload;

    try {
      // Verify stock availability for every item against product-service
      for (const item of items) {
        const { data } = await axios.get(`${PRODUCT_SERVICE_URL}/${item.productId}`);
        if (!data.product || data.product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.productId}`);
        }
      }

      // Decrement stock for each item
      for (const item of items) {
        await axios.patch(`${PRODUCT_SERVICE_URL}/${item.productId}/stock`, { delta: -item.quantity });
      }

      await Reservation.create({ orderId, items, status: 'RESERVED' });
      await publishEvent(producer, 'inventory.events', 'inventory.reserved', { orderId, items });
    } catch (err) {
      await Reservation.create({ orderId, items, status: 'FAILED', reason: err.message });
      await publishEvent(producer, 'inventory.events', 'inventory.failed', { orderId, reason: err.message });
    }
  });
}

module.exports = { initKafka };
