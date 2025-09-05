import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private attempts = new Map<string, { count: number; resetTime: number }>();

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip = this.getClientIp(request);
    
    const rateLimit = this.reflector.get<{attempts: number; windowMs: number}>('rateLimit', context.getHandler());
    
    if (!rateLimit) return true;

    const key = `${ip}:${request.route.path}`;
    const now = Date.now();
    
    const record = this.attempts.get(key);
    
    if (!record || now > record.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + rateLimit.windowMs });
      return true;
    }

    if (record.count >= rateLimit.attempts) {
      throw new HttpException(
        'Demasiados intentos. Intenta nuevamente más tarde.',
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    record.count++;
    return true;
  }

  private getClientIp(request: any): string {
    return request.ip || 
           request.connection.remoteAddress || 
           request.socket.remoteAddress ||
           (request.connection.socket ? request.connection.socket.remoteAddress : null) ||
           '0.0.0.0';
  }
}