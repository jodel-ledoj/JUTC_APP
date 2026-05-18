export function formatJMD(amountJMD: number): string {
  return new Intl.NumberFormat('en-JM', {
    style: 'currency',
    currency: 'JMD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountJMD);
}

export function formatJMDShort(amountJMD: number): string {
  return `$${amountJMD.toFixed(2)}`;
}

export function parseJMD(str: string): number {
  return parseFloat(str.replace(/[^0-9.]/g, ''));
}

export function roundJMD(amount: number): number {
  return Math.round(amount * 100) / 100;
}
