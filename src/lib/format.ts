const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

/** Converts Latin digits in a string to Bengali digits. */
export function toBengaliDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => BN_DIGITS[Number(d)]!);
}

/** ৳১,৫০০ */
export function formatBdt(amount: number): string {
  return `৳${toBengaliDigits(amount.toLocaleString("en-US"))}`;
}

export function discountPercent(price: number, original?: number): number | null {
  if (!original || original <= price) return null;
  return Math.round(((original - price) / original) * 100);
}
