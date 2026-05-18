import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS_TOKEN: 'jutc_access_token',
  REFRESH_TOKEN: 'jutc_refresh_token',
  USER: 'jutc_user',
  QR_TICKET: 'jutc_qr_ticket',
} as const;

export async function saveTokens(accessToken: string, refreshToken: string) {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken),
    SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken),
  ]);
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
}

export async function clearTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN),
    SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
  ]);
}

export async function saveQRTicket(token: string, expiresAt: string) {
  await SecureStore.setItemAsync(KEYS.QR_TICKET, JSON.stringify({ token, expiresAt }));
}

export async function getQRTicket(): Promise<{ token: string; expiresAt: string } | null> {
  const raw = await SecureStore.getItemAsync(KEYS.QR_TICKET);
  if (!raw) return null;
  const ticket = JSON.parse(raw);
  if (new Date(ticket.expiresAt) < new Date()) {
    await SecureStore.deleteItemAsync(KEYS.QR_TICKET);
    return null;
  }
  return ticket;
}
