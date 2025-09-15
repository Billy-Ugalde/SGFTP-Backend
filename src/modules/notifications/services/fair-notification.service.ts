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

  async sendFairChangeEmails(oldFair: Fair, newFair: Fair): Promise<void> {
    console.log('\n=== INICIANDO SISTEMA DE NOTIFICACIONES CONSOLIDADAS ===');
    console.log(`Feria: ${newFair.name}`);
    console.log(`ID: ${newFair.id_fair}`);

    try {
      const allUsers = await this.userRepository.find();
      console.log(`Total usuarios en sistema: ${allUsers.length}`);

      const entrepreneurs = allUsers.filter(user => 
        user.role?.id_role === 10 && user.status === true
      );

      console.log(`Total emprendedores activos: ${entrepreneurs.length}`);
      
      if (entrepreneurs.length === 0) {
        console.log('No hay emprendedores activos registrados');
        return;
      }

      const hasStatusChange = this.hasStatusChange(oldFair, newFair);
      
      const contentChanges = this.detectAllContentChanges(oldFair, newFair);
      
      console.log(`\n=== RESUMEN DE CAMBIOS ===`);
      console.log(`¿Cambio de estado?: ${hasStatusChange ? 'SÍ' : 'NO'}`);
      console.log(`Cambios de contenido: ${contentChanges.length}`);

      let totalEmailsSent = 0;
      let totalEmailsFailed = 0;

      // ENVÍO 1: Email de ESTADO (solo si cambió el status)
      if (hasStatusChange) {
        const statusType = oldFair.status === true && newFair.status === false ? 'Feria Cancelada' : 'Feria Reactivada';
        const statusMessage = statusType === 'Feria Cancelada' 
          ? 'Lamentamos informarte que la feria ha sido cancelada. Te contactaremos con más información pronto.'
          : 'La feria ha sido reactivada. Te invitamos a participar nuevamente.';

        console.log(`\n=== ENVIANDO EMAIL DE ESTADO: ${statusType} ===`);
        
        for (const user of entrepreneurs) {
          const person = user.person;
          
          if (person?.email && person.first_name) {
            try {
              const fullName = `${person.first_name} ${person.first_lastname || ''}`.trim();
              
              await this.notificationService.sendStatusChangeEmail(
                person.email,
                fullName,
                newFair.name,
                statusType,
                statusMessage
              );
              
              console.log(`✅ Email de estado enviado a: ${person.email}`);
              totalEmailsSent++;
              
            } catch (error: any) {
              console.error(`❌ Error enviando email de estado a ${person.email}: ${error.message}`);
              totalEmailsFailed++;
            }
          }
        }
      }

      // ENVÍO 2: Email CONSOLIDADO de cambios de contenido (solo si hay cambios)
      if (contentChanges.length > 0) {
        console.log(`\n=== ENVIANDO EMAIL CONSOLIDADO CON ${contentChanges.length} CAMBIOS ===`);
        
        for (const user of entrepreneurs) {
          const person = user.person;
          
          if (person?.email && person.first_name) {
            try {
              const fullName = `${person.first_name} ${person.first_lastname || ''}`.trim();
              
              await this.notificationService.sendContentChangesEmail(
                person.email,
                fullName,
                newFair.name,
                contentChanges
              );
              
              console.log(`✅ Email consolidado enviado a: ${person.email}`);
              totalEmailsSent++;
              
            } catch (error: any) {
              console.error(`❌ Error enviando email consolidado a ${person.email}: ${error.message}`);
              totalEmailsFailed++;
            }
          } else {
            console.log(`⚠️ Usuario con datos incompletos: User ID ${user.id_user}`);
            totalEmailsFailed++;
          }
        }
      }

      console.log(`\n=== PROCESO COMPLETADO ===`);
      console.log(`Emprendedores encontrados: ${entrepreneurs.length}`);
      console.log(`¿Envió email de estado?: ${hasStatusChange ? 'SÍ' : 'NO'}`);
      console.log(`¿Envió email consolidado?: ${contentChanges.length > 0 ? 'SÍ' : 'NO'}`);
      console.log(`Emails enviados: ${totalEmailsSent}`);
      console.log(`Emails fallidos: ${totalEmailsFailed}`);

    } catch (error: any) {
      console.error('\n❌ ERROR EN EL SISTEMA DE NOTIFICACIONES:');
      console.error(`Error: ${error.message}`);
      console.error(`Stack: ${error.stack}`);
    }
  }

  private hasStatusChange(oldFair: Fair, newFair: Fair): boolean {
    return oldFair.status !== newFair.status;
  }

  private detectAllContentChanges(oldFair: Fair, newFair: Fair): ChangeInfo[] {
    const changes: ChangeInfo[] = [];

    console.log('\n=== DETECTANDO TODOS LOS CAMBIOS DE CONTENIDO ===');

    // 1. CAMBIO DE NOMBRE
    if (oldFair.name !== newFair.name) {
      changes.push({
        field: 'Nombre de la Feria',
        oldValue: oldFair.name || 'Sin nombre',
        newValue: newFair.name || 'Sin nombre',
        description: 'El nombre de la feria ha cambiado'
      });
      console.log(`✅ Cambio detectado: Nombre "${oldFair.name}" → "${newFair.name}"`);
    }

    // 2. CAMBIO DE DESCRIPCIÓN
    if (oldFair.description !== newFair.description) {
      const oldDesc = oldFair.description || 'Sin descripción';
      const newDesc = newFair.description || 'Sin descripción';
      changes.push({
        field: 'Descripción',
        oldValue: oldDesc.length > 150 ? oldDesc.substring(0, 150) + '...' : oldDesc,
        newValue: newDesc.length > 150 ? newDesc.substring(0, 150) + '...' : newDesc,
        description: 'La descripción de la feria ha sido actualizada'
      });
      console.log(`✅ Cambio detectado: Descripción actualizada`);
    }

    // 3. CAMBIO DE FECHA
    if (oldFair.date?.toString() !== newFair.date?.toString()) {
      const oldDate = oldFair.date ? new Date(oldFair.date).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : 'Sin fecha definida';
      
      const newDate = newFair.date ? new Date(newFair.date).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : 'Sin fecha definida';
      
      changes.push({
        field: 'Fecha',
        oldValue: oldDate,
        newValue: newDate,
        description: 'La fecha de la feria ha cambiado. Por favor ajusta tu calendario'
      });
      console.log(`✅ Cambio detectado: Fecha "${oldDate}" → "${newDate}"`);
    }

    // 4. CAMBIO DE UBICACIÓN
    if (oldFair.location !== newFair.location) {
      changes.push({
        field: 'Ubicación',
        oldValue: oldFair.location || 'Sin ubicación definida',
        newValue: newFair.location || 'Sin ubicación definida',
        description: 'La ubicación de la feria ha cambiado. Asegúrate de dirigirte al lugar correcto'
      });
      console.log(`✅ Cambio detectado: Ubicación "${oldFair.location}" → "${newFair.location}"`);
    }

    // 5. CAMBIO DE CONDICIONES
    if (oldFair.conditions !== newFair.conditions) {
      const oldCond = oldFair.conditions || 'Sin condiciones especiales';
      const newCond = newFair.conditions || 'Sin condiciones especiales';
      changes.push({
        field: 'Condiciones',
        oldValue: oldCond.length > 150 ? oldCond.substring(0, 150) + '...' : oldCond,
        newValue: newCond.length > 150 ? newCond.substring(0, 150) + '...' : newCond,
        description: 'Las condiciones de participación han sido actualizadas. Revisa los nuevos requisitos'
      });
      console.log(`✅ Cambio detectado: Condiciones actualizadas`);
    }

    // 6. CAMBIO DE TIPO DE FERIA
    if (oldFair.typeFair !== newFair.typeFair) {
      const oldTypeDisplay = oldFair.typeFair === 'interna' ? 'Interna' : 'Externa';
      const newTypeDisplay = newFair.typeFair === 'interna' ? 'Interna' : 'Externa';
      
      changes.push({
        field: 'Tipo de Feria',
        oldValue: oldTypeDisplay,
        newValue: newTypeDisplay,
        description: 'El tipo de feria ha cambiado'
      });
      console.log(`✅ Cambio detectado: Tipo "${oldTypeDisplay}" → "${newTypeDisplay}"`);
    }

    // 7. CAMBIO DE CAPACIDAD DE STANDS
    if (oldFair.stand_capacity !== newFair.stand_capacity) {
      changes.push({
        field: 'Capacidad de Stands',
        oldValue: oldFair.stand_capacity?.toString() || 'No especificado',
        newValue: newFair.stand_capacity?.toString() || 'No especificado',
        description: 'La capacidad total de stands disponibles ha cambiado'
      });
      console.log(`✅ Cambio detectado: Capacidad "${oldFair.stand_capacity}" → "${newFair.stand_capacity}"`);
    }

    console.log(`\n📊 TOTAL CAMBIOS DE CONTENIDO DETECTADOS: ${changes.length}`);
    
    if (changes.length === 0) {
      console.log('ℹ️ No se detectaron cambios de contenido, solo se enviará email si hay cambio de estado');
    } else {
      changes.forEach((change, index) => {
        console.log(`${index + 1}. ${change.field}: ${change.oldValue} → ${change.newValue}`);
      });
    }

    return changes;
  }
}