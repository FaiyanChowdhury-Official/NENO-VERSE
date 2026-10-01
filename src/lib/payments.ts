export type PaymentMethod = "bkash" | "rocket" | "bank";

// NOTE: placeholder merchant details — replace with the real business accounts.
export const paymentMethods: Record<
  PaymentMethod,
  { label: string; account: string; instructions: string[] }
> = {
  bkash: {
    label: "বিকাশ",
    account: "01XXXXXXXXX (মার্চেন্ট)",
    instructions: [
      "বিকাশ অ্যাপ থেকে \"পেমেন্ট\" অপশনে যান",
      "উপরের মার্চেন্ট নম্বরে মোট টাকা পাঠান",
      "ট্রানজেকশন আইডি (TrxID) নিচে লিখুন",
    ],
  },
  rocket: {
    label: "রকেট",
    account: "01XXXXXXXXX-X (মার্চেন্ট)",
    instructions: [
      "রকেট অ্যাপ বা *322# থেকে পেমেন্ট করুন",
      "উপরের নম্বরে মোট টাকা পাঠান",
      "ট্রানজেকশন আইডি নিচে লিখুন",
    ],
  },
  bank: {
    label: "ব্যাংক ট্রান্সফার",
    account: "অক্টোপাস লিমিটেড, A/C: XXXXXXXXXXXX, ব্যাংক: XXXX, শাখা: XXXX",
    instructions: [
      "উপরের অ্যাকাউন্টে মোট টাকা ট্রান্সফার করুন",
      "রেফারেন্স/ট্রানজেকশন নম্বর নিচে লিখুন",
      "যে অ্যাকাউন্ট বা নম্বর থেকে পাঠিয়েছেন তা দিন",
    ],
  },
};

export const orderStatusLabels = {
  pending: "যাচাই চলছে",
  approved: "অনুমোদিত",
  rejected: "বাতিল",
} as const;

export function paymentLabel(m: string): string {
  return m === "manual" ? "অ্যাডমিন দ্বারা প্রদত্ত" : (paymentMethods[m as PaymentMethod]?.label ?? m);
}
