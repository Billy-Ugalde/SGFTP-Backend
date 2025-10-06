export const jwtConfig = {
  development: {
    accessToken: {
      secret: process.env.JWT_SECRET || 'dev-access-secret-change-in-production',
      expiresIn: '2h', // 2 horas para mejor UX en desarrollo
    },
    refreshToken: {
      secret: process.env.JWT_SECRET || 'dev-refresh-secret-change-in-production',
      expiresIn: '30d', // 30 días
    }
  },
  production: {
    accessToken: {
      secret: process.env.JWT_SECRET, // Obligatorio en prod
      expiresIn: '1h', // 1 hora - balance entre seguridad y UX
    },
    refreshToken: {
      secret: process.env.JWT_SECRET, // Obligatorio en prod
      expiresIn: '30d', // 30 días
    }
  }
};