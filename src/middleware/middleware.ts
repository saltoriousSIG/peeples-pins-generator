import { Request, Response, NextFunction } from 'express';
import { AUTH_TOKEN } from '../utils.js';

const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1];

  if (token !== AUTH_TOKEN) {
    res.status(403).json({ error: 'Invalid token' });
    return;
  }

  next();
}

export default authenticate;
