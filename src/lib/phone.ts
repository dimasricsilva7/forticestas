const BRAZILIAN_DDDS = new Set([
  "11","12","13","14","15","16","17","18","19",
  "21","22","24","27","28",
  "31","32","33","34","35","37","38",
  "41","42","43","44","45","46","47","48","49",
  "51","53","54","55",
  "61","62","63","64","65","66","67","68","69",
  "71","73","74","75","77","79",
  "81","82","83","84","85","86","87","88","89",
  "91","92","93","94","95","96","97","98","99",
]);

/** Keep only one Brazilian national phone number (DDD + 8 or 9 digits). */
export function normalizeBrazilianPhone(value: string): string {
  return value.replace(/\\D/g, "");
}

export function isValidBrazilianPhone(value: string): boolean {
  const digits = normalizeBrazilianPhone(value);
  if (digits.length !== 10 && digits.length !== 11) return false;
  if (!BRAZILIAN_DDDS.has(digits.slice(0, 2))) return false;

  const subscriber = digits.slice(2);
  return subscriber.length === 9
    ? subscriber.startsWith("9")
    : /^[2-5]/.test(subscriber);
}

export function formatBrazilianPhone(value: string): string {
  const digits = normalizeBrazilianPhone(value);
  if (!digits) return "";

  const ddd = digits.slice(0, 2);
  if (digits.length <= 2) return `(${ddd}`;

  const subscriber = digits.slice(2);
  if (digits.length === 11) {
    return `(${ddd}) ${subscriber.slice(0, 5)}${subscriber.length > 5 ? `-${subscriber.slice(5)}` : ""}`;
  }

  return `(${ddd}) ${subscriber.slice(0, 4)}${subscriber.length > 4 ? `-${subscriber.slice(4)}` : ""}`;
}
