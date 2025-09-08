import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto'; 

@Injectable()
export class PasswordService {
  private readonly saltRounds = 12; // Recomendación OWASP 2024

  /**
   * Hashea una contraseña de forma segura
   */
  async hashPassword(plainPassword: string): Promise<string> {
    try {
      return await bcrypt.hash(plainPassword, this.saltRounds);
    } catch (error) {
      throw new Error('Error al procesar la contraseña');
    }
  }

  /**
   * Verifica una contraseña contra su hash
   */
  async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      return false; // Nunca lanzar error en verificación
    }
  }

  /**
   * Valida fortaleza de contraseña
   */
  validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('La contraseña debe tener al menos 8 caracteres');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Debe contener al menos una letra minúscula');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Debe contener al menos una letra mayúscula');
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push('Debe contener al menos un número');
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('Debe contener al menos un carácter especial (@$!%*?&)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  generateTemporaryPassword(): string {
    // Generar contraseña temporal segura usando crypto
    const randomBuffer = randomBytes(12);
    
    // Convertir a base64 y limpiar caracteres problemáticos
    let password = randomBuffer.toString('base64')
      .replace(/[+/=]/g, '')  // Remover caracteres problemáticos para URLs
      .substring(0, 10);      // Longitud manejable
    
    // Asegurar que cumple políticas mínimas
    password = password + 'A1!'; // Garantizar mayúscula, número y símbolo
    
    return password;
  }

  // ===== MÉTODOS FUTUROS (COMENTADOS) =====
  /*
  generatePasswordResetToken(): string {
    return randomBytes(32).toString('hex');
  }

  generateEmailVerificationToken(): string {
    return randomBytes(32).toString('hex');
  }
  */

}