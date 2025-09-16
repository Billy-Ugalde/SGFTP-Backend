import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationService } from './notification.service';
import { Fair } from '../../fairs/entities/fair.entity';
import { User } from '../../users/entities/user.entity';

interface ChangeInfo {
  field: string;
  oldValue: string;
  newValue: string;
  description: string;
}

@Injectable()
export class FairNotificationService {
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

  async sendFairChangeEmails(oldFair: Fair, newFair: Fair): Promise<void> {
  try {
    const entrepreneurs = await this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.person', 'person')
      .innerJoin('user.roles', 'role')
      .where('role.name = :roleName', { roleName: 'entrepreneur' })
      .andWhere('user.status = :status', { status: true })
      .getMany();

    if (entrepreneurs.length === 0) return;

    const hasStatusChange = this.hasStatusChange(oldFair, newFair);
    const contentChanges = this.detectAllContentChanges(oldFair, newFair);

    if (!hasStatusChange && contentChanges.length === 0) return;

    await this.sendEmailsInBatches(
      entrepreneurs,
      oldFair,
      newFair,
      hasStatusChange,
      contentChanges,
    );
  } catch (error: any) {
    console.error(`Error en notificaciones: ${error.message}`);
  }
}

  private async sendEmailsInBatches(
    entrepreneurs: User[],
    oldFair: Fair,
    newFair: Fair,
    hasStatusChange: boolean,
    contentChanges: ChangeInfo[],
  ): Promise<void> {
    const BATCH_SIZE = 5;
    const DELAY_MS = 2000;

    let totalSent = 0;
    let totalFailed = 0;

    for (let i = 0; i < entrepreneurs.length; i += BATCH_SIZE) {
      const batch = entrepreneurs.slice(i, i + BATCH_SIZE);

      const batchPromises: Promise<void>[] = [];

      for (const user of batch) {
        const person = user.person;

        if (person?.email && person.first_name) {
          const fullName =
            `${person.first_name} ${person.first_lastname || ''}`.trim();

          if (hasStatusChange) {
            const statusType =
              oldFair.status === true && newFair.status === false
                ? 'Feria Cancelada'
                : 'Feria Reactivada';
            const statusMessage =
              statusType === 'Feria Cancelada'
                ? 'Lamentamos informarte que la feria ha sido cancelada. Te contactaremos con más información pronto.'
                : 'La feria ha sido reactivada. Te invitamos a participar nuevamente.';

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
              })
              .catch(() => {
                totalFailed++;
              });

            batchPromises.push(statusPromise);
          }

          if (contentChanges.length > 0) {
            const changesPromise = this.notificationService
              .sendContentChangesEmail(
                person.email,
                fullName,
                newFair.name,
                contentChanges,
              )
              .then(() => {
                totalSent++;
              })
              .catch(() => {
                totalFailed++;
              });

            batchPromises.push(changesPromise);
          }
        } else {
          totalFailed++;
        }
      }

      await Promise.allSettled(batchPromises);

      if (i + BATCH_SIZE < entrepreneurs.length) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      }
    }
  }

  private hasStatusChange(oldFair: Fair, newFair: Fair): boolean {
    return oldFair.status !== newFair.status;
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
        oldValue:
          oldDesc.length > 150 ? oldDesc.substring(0, 150) + '...' : oldDesc,
        newValue:
          newDesc.length > 150 ? newDesc.substring(0, 150) + '...' : newDesc,
        description: 'La descripción de la feria ha sido actualizada',
      });
    }

    // 3. CAMBIO DE FECHA
    if (oldFair.date?.toString() !== newFair.date?.toString()) {
      const oldDate = oldFair.date
        ? new Date(oldFair.date).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : 'Sin fecha definida';

      const newDate = newFair.date
        ? new Date(newFair.date).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : 'Sin fecha definida';

      changes.push({
        field: 'Fecha',
        oldValue: oldDate,
        newValue: newDate,
        description:
          'La fecha de la feria ha cambiado. Por favor ajusta tu calendario',
      });
    }

    // 4. CAMBIO DE UBICACIÓN
    if (oldFair.location !== newFair.location) {
      changes.push({
        field: 'Ubicación',
        oldValue: oldFair.location || 'Sin ubicación definida',
        newValue: newFair.location || 'Sin ubicación definida',
        description:
          'La ubicación de la feria ha cambiado. Asegúrate de dirigirte al lugar correcto',
      });
    }

    // 5. CAMBIO DE CONDICIONES
    if (oldFair.conditions !== newFair.conditions) {
      const oldCond = oldFair.conditions || 'Sin condiciones especiales';
      const newCond = newFair.conditions || 'Sin condiciones especiales';
      changes.push({
        field: 'Condiciones',
        oldValue:
          oldCond.length > 150 ? oldCond.substring(0, 150) + '...' : oldCond,
        newValue:
          newCond.length > 150 ? newCond.substring(0, 150) + '...' : newCond,
        description:
          'Las condiciones de participación han sido actualizadas. Revisa los nuevos requisitos',
      });
    }

    // 6. CAMBIO DE TIPO DE FERIA
    if (oldFair.typeFair !== newFair.typeFair) {
      const oldTypeDisplay =
        oldFair.typeFair === 'interna' ? 'Interna' : 'Externa';
      const newTypeDisplay =
        newFair.typeFair === 'interna' ? 'Interna' : 'Externa';

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