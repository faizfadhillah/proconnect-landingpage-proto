
declare global {
  namespace Express {
    interface User {
      id: string;
      roles: array;
      [key: string]: any; // Jika ada properti tambahan
    }

    interface Request {
      user?: User;
    }
  }
}
