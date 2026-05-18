import { TokenPayload } from '@jutc/shared';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}
