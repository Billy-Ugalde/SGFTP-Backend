export const jwtConfig = {
  development: {
    accessToken: {
      secret: process.env.JWT_SECRET || 'dev-access-secret-change-in-production',
      expiresIn: '30m', // Más tiempo en dev para debugging
    },
    refreshToken: {
      secret: process.env.JWT_SECRET || 'dev-refresh-secret-change-in-production',
      expiresIn: '7d', // 7 días para desarrollo cómodo
    }
  },
  production: {
    accessToken: {
      secret: process.env.JWT_SECRET, // Obligatorio en prod
      expiresIn: '15m', // Más estricto en producción
    },
    refreshToken: {
      secret: process.env.JWT_SECRET, // Obligatorio en prod
      expiresIn: '30d',
    }
  }
};