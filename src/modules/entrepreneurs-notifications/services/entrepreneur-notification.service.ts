import { Injectable } from '@nestjs/common';
import { Entrepreneur } from 'src/modules/entrepreneurs/entities/entrepreneur.entity';
import { 
  BatchEmailResult, 
  ServiceResponse
} from '../interfaces/entrepreneur-notification.interface';
import { IEntrepreneurNotificationService } from '../interfaces/entrepreneur-notification-service.interface';
import { EntrepreneurEmailService } from './entrepreneur-email.service';
import { EntrepreneurTemplateService } from './entrepreneur-template.service';

@Injectable()
export class EntrepreneurNotificationService implements IEntrepreneurNotificationService {
  constructor(
    private emailService: EntrepreneurEmailService,
    private templateService: EntrepreneurTemplateService
  ) {}

  async sendEntrepreneurRejectionEmailAsync(entrepreneur: Entrepreneur): Promise<void> {
    setImmediate(() => {
      this.sendEntrepreneurRejectionEmail(entrepreneur).catch(error => {
        console.error('Error en notificación de rechazo background:', error);
      });
    });
  }

  async sendEntrepreneurRejectionEmail(entrepreneur: Entrepreneur): Promise<ServiceResponse<BatchEmailResult>> {
  console.log('🎬 ENTREPRENEUR-NOTIFICATION: Iniciando sendEntrepreneurRejectionEmail');
  
  try {
    const person = entrepreneur.person;
    console.log('👤 Datos de persona:', {
      tienePerson: !!person,
      email: person?.email,
      nombre: person?.first_name,
      apellido: person?.first_lastname
    });
    
    if (!person?.email) {
      console.log('❌ ENTREPRENEUR-NOTIFICATION: No hay email disponible');
      return {
        success: false,
        error: 'No se encontró email del emprendedor',
        data: { totalSent: 0, totalFailed: 0, errors: ['Email no disponible'] }
      };
    }

    const fullName = `${person.first_name} ${person.first_lastname || ''}`.trim();
    console.log('📝 Generando email para:', { fullName, email: person.email });

    // 1. Generar contenido del email
    console.log('🔄 Generando template...');
    const emailData = {
      recipientName: person.first_name,
      recipientEmail: person.email,
      entrepreneurName: fullName,
      rejectionReason: 'Su solicitud no se alinea con los enfoques y criterios establecidos por la Fundación Tamarindo Park.'
    };

    const htmlContent = this.templateService.generateEntrepreneurRejectionEmail(emailData);
    console.log('✅ Template generado, longitud:', htmlContent?.length);

    if (!htmlContent) {
      console.log('❌ HTML content está vacío');
      return {
        success: false,
        error: 'Error generando contenido del email',
        data: { totalSent: 0, totalFailed: 1, errors: ['Contenido del email no generado'] }
      };
    }

    // 2. Enviar email
    console.log('📤 Enviando email via EntrepreneurEmailService...');
    const emailResult = await this.emailService.sendEntrepreneurRejectionEmail(
      person.email,
      person.first_name,
      fullName,
      emailData.rejectionReason,
      htmlContent
    );

    console.log('📩 Resultado del envío:', emailResult);

    if (emailResult.success) {
      console.log('🎉 Email enviado exitosamente');
      return {
        success: true,
        data: { totalSent: 1, totalFailed: 0, errors: [] },
        message: 'Notificación de rechazo enviada exitosamente'
      };
    } else {
      console.log('💥 Error en envío de email:', emailResult.error);
      return {
        success: false,
        error: emailResult.error,
        data: { totalSent: 0, totalFailed: 1, errors: [emailResult.error || 'Error desconocido'] }
      };
    }

  } catch (error: any) {
    console.error('🔥 ERROR CRÍTICO en sendEntrepreneurRejectionEmail:', error);
    return {
      success: false,
      error: error.message,
      data: { totalSent: 0, totalFailed: 0, errors: [error.message] }
    };
  }
}

  async sendEntrepreneurStatusChangeEmail(
    entrepreneur: Entrepreneur, 
    oldStatus: string, 
    newStatus: string
  ): Promise<ServiceResponse<BatchEmailResult>> {
    // Implementación para otros cambios de estado si es necesario
    return {
      success: true,
      data: { totalSent: 0, totalFailed: 0, errors: [] },
      message: 'Método no implementado'
    };
  }
}