/**
 * Shared Kafka client wrapper (kafkajs).
 * Every microservice copies/imports this file to publish & subscribe
 * to the event bus that decouples the platform.
 *
 * Topics used across the platform:
 *   - order.events        (order.created, order.cancelled)
 *   - inventory.events     (inventory.reserved, inventory.failed)
 *   - payment.events       (payment.completed, payment.failed)
 *   - notification.events  (notification.send)
 */
const { Kafka, logLevel } = require('kafkajs');

function createKafkaClient(clientId) {
  return new Kafka({
    clientId,
    brokers: (process.env.KAFKA_BROKERS || 'kafka:9092').split(','),
    logLevel: logLevel.ERROR,
    retry: { initialRetryTime: 300, retries: 10 },
  });
}

async function createProducer(clientId) {
  const kafka = createKafkaClient(clientId);
  const producer = kafka.producer();
  await producer.connect();
  return producer;
}

async function publishEvent(producer, topic, eventType, payload) {
  const message = {
    key: payload.id || payload.orderId || payload.userId || String(Date.now()),
    value: JSON.stringify({
      eventType,
      timestamp: new Date().toISOString(),
      payload,
    }),
  };
  await producer.send({ topic, messages: [message] });
  console.log(`[kafka] published ${eventType} -> topic:${topic}`);
}

async function createConsumer(clientId, groupId, topics, onMessage) {
  const kafka = createKafkaClient(clientId);
  const consumer = kafka.consumer({ groupId });
  await consumer.connect();
  for (const topic of topics) {
    await consumer.subscribe({ topic, fromBeginning: false });
  }
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const parsed = JSON.parse(message.value.toString());
        console.log(`[kafka] consumed ${parsed.eventType} <- topic:${topic}`);
        await onMessage(parsed, { topic, partition });
      } catch (err) {
        console.error(`[kafka] error processing message on ${topic}:`, err.message);
      }
    },
  });
  return consumer;
}

module.exports = { createKafkaClient, createProducer, publishEvent, createConsumer };
