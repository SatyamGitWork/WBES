import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { AuditLog } from '../models/AuditLog.model';

export const auditLog = (action: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Intercept the response end/json methods to log only on success
    const originalJson = res.json;
    
    res.json = function (body) {
      res.locals.body = body;
      return originalJson.call(this, body);
    };

    res.on('finish', async () => {
      // Only log successful actions (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        try {
          const targetId = req.params.id || req.body?.targetId || res.locals.body?._id?.toString() || null;
          
          await AuditLog.create({
            actorId: req.user.id,
            action,
            target: targetId,
            meta: {
              method: req.method,
              path: req.originalUrl,
              ip: req.ip,
              query: Object.keys(req.query).length ? req.query : undefined,
              // Exclude sensitive fields from body
              body: req.body ? sanitizeBody(req.body) : undefined
            }
          });
        } catch (error) {
          console.error('Audit Log Error:', error);
        }
      }
    });

    next();
  };
};

function sanitizeBody(body: any) {
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'passwordHash', 'token', 'refreshToken'];
  
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
}
