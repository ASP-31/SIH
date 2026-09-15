/**
 * UPI Utility Functions for Direct-to-Consumer (D2C) Indian Payments
 */

export interface UpiIntentParams {
  upiId: string;      // pa (Payee Address / UPI ID, e.g. merchant@okicici)
  upiName: string;    // pn (Payee Name)
  amount: number;     // am (Amount in INR)
  orderId: string;    // tr (Transaction Reference ID)
  note?: string;      // tn (Transaction Note)
}

/**
 * Generates the standard P2M/P2P UPI Deep Link string compatible with
 * GPay, PhonePe, Paytm, BHIM, and CRED.
 */
export function generateUpiIntentUrl(params: UpiIntentParams): string {
  const { upiId, upiName, amount, orderId, note } = params;
  const formattedAmount = amount.toFixed(2);
  const encodedName = encodeURIComponent(upiName || 'D2C Store');
  const encodedNote = encodeURIComponent(note || `Order #${orderId.slice(0, 8)}`);

  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodedName}&am=${formattedAmount}&tr=${encodeURIComponent(orderId)}&tn=${encodedNote}&cu=INR`;
}

/**
 * Formats a number as INR (₹) currency syntax
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Validates 12-digit UPI Transaction Reference (UTR) Number
 */
export function isValidUtrNumber(utr: string): boolean {
  if (!utr) return false;
  const cleaned = utr.trim();
  return /^[0-9]{12}$/.test(cleaned);
}
