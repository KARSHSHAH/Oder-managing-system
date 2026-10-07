import React from 'react';

const statusClasses = {
  Pending: 'badge-pending',
  Confirmed: 'badge-confirmed',
  Packed: 'badge-packed',
  Dispatched: 'badge-dispatched',
  Delivered: 'badge-delivered',
  Cancelled: 'badge-cancelled',
};

const OrderStatusBadge = ({ status }) => {
  const badgeClass = statusClasses[status] || 'badge-pending';
  return (
    <span className={`badge ${badgeClass}`}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: 'currentColor',
          display: 'inline-block',
        }}
      />
      {status}
    </span>
  );
};

export default OrderStatusBadge;
