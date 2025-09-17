import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationService } from './notification.service';
import { Fair } from '../../fairs/entities/fair.entity';
import { User } from '../../users/entities/user.entity';
import { 
  ChangeInfo, 
  BatchEmailResult, 
  ServiceResponse, 
  UserEmailData, 
  BatchConfig 
} from '../interfaces/notification.interface';
import { IFairNotificationService } from '../interfaces/fair-notification-service.interface';

@Injectable()
export class FairNotificationService implements IFairNotificationService {
  constructor(
    private notificationService: NotificationService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async sendFairChangeEmailsAsync(oldFair: Fair, newFair: Fair): Promise<void> {
    setImmediate(() => {
      this.sendFairChangeEmails(oldFair, newFair).catch(error => {
        console.error('Error en notificaciones background:', error);
      });
    });
  }

  async sendNewFairEmailsAsync(newFair: Fair): Promise<void> {
    setImmediate(() => {
      this.sendNewFairEmails(newFair).catch(error => {
        console.error('Error en notificaciones de nueva feria background:', error);
      });
    });
  }

  async sendFairChangeEmails(oldFair: Fair, newFair: Fair): Promise<ServiceResponse<BatchEmailResult>> {
    try {
      const entrepreneurs = await this.getActiveEntrepreneurs();

      if (entrepreneurs.length === 0) {
        return {
          success: true,
          data: { totalSent: 0, totalFailed: 0, errors: [] },
          message: 'No se encontraron emprendedores'
        };
      }

      const hasStatusChange = this.detectStatusChange(oldFair, newFair);
      const contentChanges = this.detectContentChanges(oldFair, newFair);

      if (!hasStatusChange && contentChanges.length === 0) {
        return {
          success: true,
          data: { totalSent: 0, totalFailed: 0, errors: [] },
          message: 'No se detectaron cambios'
        };
      }

      const changeType = hasStatusChange ? 'CAMBIO DE ESTADO' : 'CAMBIOS DE CONTENIDO';
      console.log(`📧 ${changeType} - Feria: ${newFair.name} | Destinatarios: ${entrepreneurs.length}`);

      const result = await this.sendEmailsInBatches(
        entrepreneurs,
        oldFair,
        newFair,
        hasStatusChange,
        contentChanges,
      );

      console.log(`✅ Notificaciones completadas - Enviados: ${result.totalSent} | Fallidos: ${result.totalFailed}`);

      return {
        success: true,
        data: result,
        message: 'Notificaciones enviadas exitosamente'
      };
    } catch (error: any) {
      console.error(`❌ Error en notificaciones: ${error.message}`);
      return {
        success: false,
        error: error.message,
        data: { totalSent: 0, totalFailed: 0, errors: [error.message] }
      };
    }
  }

  async sendNewFairEmails(newFair: Fair): Promise<ServiceResponse<BatchEmailResult>> {
    try {
      const entrepreneurs = await this.getActiveEntrepreneurs();

      if (entrepreneurs.length === 0) {
        return {
          success: true,
          data: { totalSent: 0, totalFailed: 0, errors: [] },
          message: 'No se encontraron emprendedores para notificar'
        };
      }
      
      console.log(`📧 NUEVA FERIA - Feria: ${newFair.name} | Destinatarios: ${entrepreneurs.length}`);

      const result = await this.sendNewFairEmailsInBatches(entrepreneurs, newFair);

      console.log(`✅ Nueva feria notificada - Enviados: ${result.totalSent} | Fallidos: ${result.totalFailed}`);

      return {
        success: true,
        data: result,
        message: 'Notificaciones de nueva feria enviadas exitosamente'
      };
    } catch (error: any) {
      console.error(`❌ Error en notificaciones de nueva feria: ${error.message}`);
      return {
        success: false,
        error: error.message,
        data: { totalSent: 0, totalFailed: 0, errors: [error.message] }
      };
    }
  }

  private async getActiveEntrepreneurs(): Promise<User[]> {
    return await this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.person', 'person')
      .innerJoin('user.roles', 'role')
      .where('role.name = :roleName', { roleName: 'entrepreneur' })
      .andWhere('user.status = :status', { status: true })
      .getMany();
  }

  async validateUsers(users: User[]): Promise<UserEmailData[]> {
    return users
      .filter(user => user.person?.email && user.person?.first_name)
      .map(user => ({
        email: user.person.email,
        firstName: user.person.first_name,
        lastName: user.person.first_lastname || '',
        fullName: `${user.person.first_name} ${user.person.first_lastname || ''}`.trim(),
        isValid: true
      }));
  }

  detectStatusChange(oldFair: Fair, newFair: Fair): boolean {
    const oldStatus = Boolean(oldFair.status);
    const newStatus = Boolean(newFair.status);
    return oldStatus !== newStatus;
  }

  detectContentChanges(oldFair: Fair, newFair: Fair): ChangeInfo[] {
    return this.detectAllContentChanges(oldFair, newFair);
  }

  async sendEmailsInBatches(
    entrepreneurs: User[],
    oldFair: Fair,
    newFair: Fair,
    hasStatusChange: boolean,
    contentChanges: ChangeInfo[],
    batchConfig?: BatchConfig
  ): Promise<BatchEmailResult> {
    const config = batchConfig || { batchSize: 5, delayMs: 2000, maxRetries: 1 };
    const BATCH_SIZE = config.batchSize;
    const DELAY_MS = config.delayMs;

    let totalSent = 0;
    let totalFailed = 0;
    const errors: string[] = [];
    const sentEmails: string[] = [];

    for (let i = 0; i < entrepreneurs.length; i += BATCH_SIZE) {
      const batch = entrepreneurs.slice(i, i + BATCH_SIZE);
      const batchPromises: Promise<void>[] = [];

      for (const user of batch) {
        const person = user.person;

        if (!person?.email || !person.first_name) {
          totalFailed++;
          errors.push(`Datos de usuario inválidos para usuario ID: ${user.id_user}`);
          continue;
        }

        const fullName = `${person.first_name} ${person.first_lastname || ''}`.trim();

        if (hasStatusChange) {
          const statusType = this.getStatusChangeType(oldFair, newFair);
          const statusMessage = this.getStatusMessage(statusType);

          const statusPromise = this.notificationService
            .sendStatusChangeEmail(
              person.email,
              fullName,
              newFair.name,
              statusType,
              statusMessage,
            )
            .then(() => {
              totalSent++;
              sentEmails.push(`${person.email} (${statusType})`);
            })
            .catch((error) => {
              totalFailed++;
              const errorMsg = `Error enviando email de estado a ${person.email}: ${error.message}`;
              errors.push(errorMsg);
            });

          batchPromises.push(statusPromise);

        } else if (contentChanges.length > 0) {
          const changesPromise = this.notificationService
            .sendContentChangesEmail(
              person.email,
              fullName,
              newFair.name,
              contentChanges,
            )
            .then(() => {
              totalSent++;
              sentEmails.push(`${person.email} (Cambios de contenido)`);
            })
            .catch((error) => {
              totalFailed++;
              const errorMsg = `Error enviando email de cambios a ${person.email}: ${error.message}`;
              errors.push(errorMsg);
            });

          batchPromises.push(changesPromise);
        }
      }

      await Promise.allSettled(batchPromises);

      if (i + BATCH_SIZE < entrepreneurs.length) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      }
    }
    if (sentEmails.length > 0) {
      console.log('📬 Emails enviados exitosamente:');
      sentEmails.forEach(email => console.log(`  → ${email}`));
    }

    if (errors.length > 0) {
      console.log('⚠️ Errores en envío:');
      errors.forEach(error => console.log(`  → ${error}`));
    }
    
    return {
      totalSent,
      totalFailed,
      errors
    };
  }

  async sendNewFairEmailsInBatches(
    entrepreneurs: User[],
    newFair: Fair,
    batchConfig?: BatchConfig
  ): Promise<BatchEmailResult> {
    const config = batchConfig || { batchSize: 5, delayMs: 2000, maxRetries: 1 };
    const BATCH_SIZE = config.batchSize;
    const DELAY_MS = config.delayMs;

    let totalSent = 0;
    let totalFailed = 0;
    const errors: string[] = [];
    const sentEmails: string[] = [];

    for (let i = 0; i < entrepreneurs.length; i += BATCH_SIZE) {
      const batch = entrepreneurs.slice(i, i + BATCH_SIZE);
      const batchPromises: Promise<void>[] = [];

      for (const user of batch) {
        const person = user.person;

        if (!person?.email || !person.first_name) {
          totalFailed++;
          errors.push(`Datos de usuario inválidos para usuario ID: ${user.id_user}`);
          continue;
        }

        const fullName = `${person.first_name} ${person.first_lastname || ''}`.trim();

        const fairDate = newFair.date
          ? new Date(newFair.date).toLocaleString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })
          : 'Por definir';

        const fairTypeDisplay = newFair.typeFair === 'interna' ? 'Interna' : 'Externa';

        const newFairPromise = this.notificationService
          .sendNewFairEmail(
            person.email,
            fullName,
            newFair.name,
            newFair.description || 'Sin descripción disponible',
            fairDate,
            newFair.location || 'Por definir',
            fairTypeDisplay,
            newFair.stand_capacity || 0,
            newFair.conditions || 'Sin condiciones especiales'
          )
          .then(() => {
            totalSent++;
            sentEmails.push(`${person.email} (Nueva feria)`);
          })
          .catch((error) => {
            totalFailed++;
            const errorMsg = `Error enviando email de nueva feria a ${person.email}: ${error.message}`;
            errors.push(errorMsg);
          });

        batchPromises.push(newFairPromise);
      }

      await Promise.allSettled(batchPromises);

      if (i + BATCH_SIZE < entrepreneurs.length) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      }
    }

    if (sentEmails.length > 0) {
      console.log('📬 Emails enviados exitosamente:');
      sentEmails.forEach(email => console.log(`  → ${email}`));
    }

    // Log de errores solo si los hay
    if (errors.length > 0) {
      console.log('⚠️ Errores en envío:');
      errors.forEach(error => console.log(`  → ${error}`));
    }
    
    return {
      totalSent,
      totalFailed,
      errors
    };
  }

  private getStatusChangeType(oldFair: Fair, newFair: Fair): string {
    const oldStatus = Boolean(oldFair.status);
    const newStatus = Boolean(newFair.status);

    if (oldStatus === true && newStatus === false) {
      return 'Feria Cancelada';
    } else if (oldStatus === false && newStatus === true) {
      return 'Feria Reactivada';
    }
    
    return 'Cambio de Estado';
  }

  private getStatusMessage(statusType: string): string {
    if (statusType === 'Feria Cancelada') {
      return 'Lamentamos informarte que la feria ha sido cancelada. Te contactaremos con más información pronto.';
    } else if (statusType === 'Feria Reactivada') {
      return 'La feria ha sido reactivada. Te invitamos a participar nuevamente.';
    }
    
    return 'El estado de la feria ha cambiado. Te mantendremos informado de cualquier novedad.';
  }

  private detectAllContentChanges(oldFair: Fair, newFair: Fair): ChangeInfo[] {
    const changes: ChangeInfo[] = [];

    // 1. CAMBIO DE NOMBRE
    if (oldFair.name !== newFair.name) {
      changes.push({
        field: 'Nombre de la Feria',
        oldValue: oldFair.name || 'Sin nombre',
        newValue: newFair.name || 'Sin nombre',
        description: 'El nombre de la feria ha cambiado',
      });
    }

    // 2. CAMBIO DE DESCRIPCIÓN
    if (oldFair.description !== newFair.description) {
      const oldDesc = oldFair.description || 'Sin descripción';
      const newDesc = newFair.description || 'Sin descripción';
      changes.push({
        field: 'Descripción',
        oldValue: oldDesc.length > 150 ? oldDesc.substring(0, 150) + '...' : oldDesc,
        newValue: newDesc.length > 150 ? newDesc.substring(0, 150) + '...' : newDesc,
        description: 'La descripción de la feria ha sido actualizada',
      });
    }

    // 3. CAMBIO DE FECHA
    if (oldFair.date?.toString() !== newFair.date?.toString()) {
      const oldDate = oldFair.date
        ? new Date(oldFair.date).toLocaleString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
        : 'Sin fecha definida';

      const newDate = newFair.date
        ? new Date(newFair.date).toLocaleString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
        : 'Sin fecha definida';

      changes.push({
        field: 'Fecha y Hora',
        oldValue: oldDate,
        newValue: newDate,
        description: 'La fecha y hora de la feria ha cambiado. Por favor ajusta tu calendario',
      });
    }

    // 4. CAMBIO DE UBICACIÓN
    if (oldFair.location !== newFair.location) {
      changes.push({
        field: 'Ubicación',
        oldValue: oldFair.location || 'Sin ubicación definida',
        newValue: newFair.location || 'Sin ubicación definida',
        description: 'La ubicación de la feria ha cambiado. Asegúrate de dirigirte al lugar correcto',
      });
    }

    // 5. CAMBIO DE CONDICIONES
    if (oldFair.conditions !== newFair.conditions) {
      const oldCond = oldFair.conditions || 'Sin condiciones especiales';
      const newCond = newFair.conditions || 'Sin condiciones especiales';
      changes.push({
        field: 'Condiciones',
        oldValue: oldCond.length > 150 ? oldCond.substring(0, 150) + '...' : oldCond,
        newValue: newCond.length > 150 ? newCond.substring(0, 150) + '...' : newCond,
        description: 'Las condiciones de participación han sido actualizadas. Revisa los nuevos requisitos',
      });
    }

    // 6. CAMBIO DE TIPO DE FERIA
    if (oldFair.typeFair !== newFair.typeFair) {
      const oldTypeDisplay = oldFair.typeFair === 'interna' ? 'Interna' : 'Externa';
      const newTypeDisplay = newFair.typeFair === 'interna' ? 'Interna' : 'Externa';

      changes.push({
        field: 'Tipo de Feria',
        oldValue: oldTypeDisplay,
        newValue: newTypeDisplay,
        description: 'El tipo de feria ha cambiado',
      });
    }

    // 7. CAMBIO DE CAPACIDAD DE STANDS
    if (oldFair.stand_capacity !== newFair.stand_capacity) {
      changes.push({
        field: 'Capacidad de Stands',
        oldValue: oldFair.stand_capacity?.toString() || 'No especificado',
        newValue: newFair.stand_capacity?.toString() || 'No especificado',
        description: 'La capacidad total de stands disponibles ha cambiado',
      });
    }

    return changes;
  }
}