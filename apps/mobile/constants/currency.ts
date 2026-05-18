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
