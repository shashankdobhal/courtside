/**
 * Builds a UPI deep link (the `upi://pay?...` scheme apps like GPay,
 * PhonePe, and Paytm register as a handler for) so tapping "Pay" on a
 * settle-up transaction opens the device's UPI app chooser pre-filled
 * with who to pay and how much — no payment gateway involved, this is
 * purely a peer-to-peer request, same as scanning someone's UPI QR code.
 */
export function buildUpiPayLink({
  vpa,
  payeeName,
  amount,
  note,
}: {
  vpa: string;
  payeeName: string;
  amount: number;
  note?: string;
}): string {
  const params = new URLSearchParams({
    pa: vpa,
    pn: payeeName,
    am: String(amount),
    cu: "INR",
  });
  if (note) params.set("tn", note);
  return `upi://pay?${params.toString()}`;
}
