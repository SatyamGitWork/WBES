import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, Role } from '../models/User.model';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: Role;
  };
}

export const requireAuth = (allowedRoles?: Role[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({ error: 'Not authorized, no token' });
      return;
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as any;

      // Ensure user still exists
      const user = await User.findById(decoded.id).select('_id role');
      if (!user) {
        res.status(401).json({ error: 'User no longer exists' });
        return;
      }

      req.user = {
        id: user._id.toString(),
        role: user.role,
      };

      if (allowedRoles && !allowedRoles.includes(user.role)) {
        res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        return;
      }

      next();
    } catch (error) {
      res.status(401).json({ error: 'Not authorized, token failed' });
      return;
    }
  };
};
