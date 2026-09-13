// Shared with AccountView, AdminAccounts, and AdminStudents so the three
// labels/pill-colors/filter-options for the computed payment status
// (PENDING_PAYMENT/PARTIALLY_PAID/FULLY_PAID — see backend/src/lib/account.js)
// can't drift out of sync with each other.
export const STATUS_LABEL = {
  FULLY_PAID: 'Fully Paid — Enrolled',
  PARTIALLY_PAID: 'Partially Paid',
  PENDING_PAYMENT: 'Pending Payment',
};

export const STATUS_PILL = {
  FULLY_PAID: 'success',
  PARTIALLY_PAID: 'warn',
  PENDING_PAYMENT: 'danger',
};

export const STATUS_OPTIONS = [
  { value: 'PENDING_PAYMENT', label: 'Pending Payment' },
  { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
  { value: 'FULLY_PAID', label: 'Fully Paid' },
];
