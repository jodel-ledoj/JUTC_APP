export const JAMAICA_TZ = 'America/Jamaica';

export function toJamaicaTime(date: Date): Date {
  return new Date(date.toLocaleString('en-US', { timeZone: JAMAICA_TZ }));
}

export function formatJamaicaTime(date: Date): string {
  return date.toLocaleString('en-US', {
    timeZone: JAMAICA_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatJamaicaDateTime(date: Date): string {
  return date.toLocaleString('en-US', {
    timeZone: JAMAICA_TZ,
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function isRushHour(date: Date): boolean {
  const jmTime = toJamaicaTime(date);
  const hour = jmTime.getHours();
  const minute = jmTime.getMinutes();
  const totalMinutes = hour * 60 + minute;
  const morningStart = 7 * 60;
  const morningEnd = 9 * 60;
  const eveningStart = 16 * 60;
  const eveningEnd = 19 * 60;
  return (
    (totalMinutes >= morningStart && totalMinutes <= morningEnd) ||
    (totalMinutes >= eveningStart && totalMinutes <= eveningEnd)
  );
}

export function minutesAgo(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / 60000);
}
