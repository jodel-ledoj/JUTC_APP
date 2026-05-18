export enum UserRole {
  PASSENGER = 'PASSENGER',
  DRIVER = 'DRIVER',
  CONDUCTOR = 'CONDUCTOR',
  INSPECTOR = 'INSPECTOR',
  ADMIN = 'ADMIN',
  EXECUTIVE = 'EXECUTIVE',
}

export interface User {
  id: string;
  email: string | null;
  phone: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  smartCardId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenPayload {
  userId: string;
  role: UserRole;
  cardId?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  tokens: AuthTokens;
}
