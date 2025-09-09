// Extend Express Request interface to include custom properties
declare global {
  namespace Express {
    interface Request {
      id: string;
      user?: {
        id: string;
        email: string;
        name: string;
        accountType: string;
      };
    }
  }
}

export {};