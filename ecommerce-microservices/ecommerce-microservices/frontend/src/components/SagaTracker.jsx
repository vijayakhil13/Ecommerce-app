// Visualizes the event-driven order saga: Order -> Inventory -> Payment -> Confirmed
const STEPS = [
  { key: 'PENDING', label: 'Order placed' },
  { key: 'INVENTORY_RESERVED', label: 'Stock reserved' },
  { key: 'PAYMENT_COMPLETED_OR_CONFIRMED', label: 'Payment processed' },
  { key: 'CONFIRMED', label: 'Confirmed' },
];

function stepState(status, stepKey, index, currentIndex) {
  if (status === 'INVENTORY_FAILED' && stepKey === 'INVENTORY_RESERVED') return 'failed';
  if (status === 'PAYMENT_FAILED' && stepKey === 'PAYMENT_COMPLETED_OR_CONFIRMED') return 'failed';
  if (index < currentIndex) return 'done';
  if (index === currentIndex) return 'active';
  return 'pending';
}

export default function SagaTracker({ status }) {
  const order = ['PENDING', 'INVENTORY_RESERVED', 'PAYMENT_COMPLETED_OR_CONFIRMED', 'CONFIRMED'];
  let currentIndex = 0;
  if (status === 'INVENTORY_RESERVED') currentIndex = 1;
  if (status === 'CONFIRMED') currentIndex = 3;
  if (status === 'INVENTORY_FAILED') currentIndex = 1;
  if (status === 'PAYMENT_FAILED') currentIndex = 2;
  if (status === 'CANCELLED') currentIndex = 0;

  return (
    <div className="saga-tracker">
      {STEPS.map((step, index) => {
        const state = stepState(status, step.key, index, currentIndex);
        return (
          <div key={step.key} className={`saga-step ${state}`}>
            <div className="saga-line" />
            <div className="saga-dot" />
            <div className="saga-label">{step.label}</div>
          </div>
        );
      })}
    </div>
  );
}
