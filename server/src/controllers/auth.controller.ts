import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.model';
import { generateAccessToken, generateRefreshToken, setRefreshTokenCookie, clearRefreshTokenCookie } from '../utils/jwt';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      res.status(400).json({ error: 'Please provide email and password' });
      return;
    }

    const user = await User.findOne({ email });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (user.isBlacklisted) {
      res.status(403).json({ error: 'Account is blacklisted. Contact administrator.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    setRefreshTokenCookie(res, refreshToken);

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.jwt;

  if (!refreshToken) {
    res.status(401).json({ error: 'No refresh token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as any;
    
    const user = await User.findById(decoded.id).select('_id role isBlacklisted');
    
    if (!user) {
      clearRefreshTokenCookie(res);
      res.status(401).json({ error: 'User not found' });
      return;
    }

    if (user.isBlacklisted) {
      clearRefreshTokenCookie(res);
      res.status(403).json({ error: 'Account is blacklisted' });
      return;
    }

    const newAccessToken = generateAccessToken(user._id.toString(), user.role);

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    clearRefreshTokenCookie(res);
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
};

export const logout = (req: Request, res: Response) => {
  clearRefreshTokenCookie(res);
  res.json({ message: 'Logged out successfully' });
};
