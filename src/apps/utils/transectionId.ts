export function generateTransactionId(): string {
    const prefix = "TRX";
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
    const randomPart = Math.floor(100000 + Math.random() * 900000); // 6 digit random

    return `${prefix}-${datePart}-${randomPart}`;
}