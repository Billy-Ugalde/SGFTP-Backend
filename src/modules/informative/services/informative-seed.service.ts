import { Injectable } from '@nestjs/common';
import { ContentBlockService } from './content-block.service';
import { ContactInfoService } from './contact-info.service';

@Injectable()
export class InformativeSeedService {
  constructor(
    private readonly contentBlockService: ContentBlockService,
    private readonly contactInfoService: ContactInfoService,
  ) {}

  async seedInformativeContent(): Promise<void> {
    console.log('🌱 Starting informative content seeding...');
    await this.seedContentBlocks();
    await this.seedContactInfo();
    console.log('✅ Informative content seeding completed');
  }

  private async seedContentBlocks() {
    const homeBlocks = [
      // Hero Section
      {
        page: 'home',
        section: 'hero',
        block_key: 'title',
        text_content: 'Tamarindo Park Foundation',
      },
      {
        page: 'home',
        section: 'hero',
        block_key: 'subtitle',
        text_content: 'Tu voz, nuestro proyecto',
      },
      {
        page: 'home',
        section: 'hero',
        block_key: 'description',
        text_content: 'Transformando comunidades a través del desarrollo sostenible integral',
      },
      {
        page: 'home',
        section: 'hero',
        block_key: 'background',
        image_url: '/images/hero-bg.jpg',
      }, 
      // Value Proposition
      {
        page: 'home',
        section: 'value_proposition',
        block_key: 'mission',
        text_content: 'Transformar de manera integral la coexistencia entre las comunidades y su entorno, mediante proyectos y programas que fortalecen las dimensiones cultural, ambiental y social.',
      },
      {
        page: 'home',
        section: 'value_proposition',
        block_key: 'vision',
        text_content: 'Nuestra visión es un mundo donde todas las comunidades rurales prosperen, con igualdad de oportunidades y la capacidad de forjar su propio futuro de manera sostenible e innovadora.',
      },
      {
        page: 'home',
        section: 'value_proposition',
        block_key: 'goal',
        text_content: 'Ser una ONG referente en desarrollo sostenible integral en pro del desarrollo de comunidades o sectores en condición de vulnerabilidad.',
      },
      // Impact Section
      {
        page: 'home',
        section: 'impact',
        block_key: 'description',
        text_content: 'Impactar de todos los enfoques posible a la comunidad por medio de la fundación.',
      },
      {
        page: 'home',
        section: 'impact',
        block_key: 'social_impact',
        text_content: 'Impactar de manera social a por medio de la fundación.',
      },
      {
        page: 'home',
        section: 'impact',
        block_key: 'cultural_impact',
        text_content: 'Impactar de manera cultural a por medio de la fundación.',
      },
      {
        page: 'home',
        section: 'impact',
        block_key: 'environmental_impact',
        text_content: 'Impactar de manera ambiental a por medio de la fundación.',
      },
      // Dimentions Section
      {
        page: 'home',
        section: 'dimensions',
        block_key: 'local_development',
        text_content: 'Promover el desarollo local por medio de la fundación.',
      },
      {
        page: 'home',
        section: 'dimensions',
        block_key: 'education',
        text_content: 'Educar a por medio de la fundación.',
      },
      {
        page: 'home',
        section: 'dimensions',
        block_key: 'prevention',
        text_content: 'Prevenir a por medio de la fundación.',
      },
      {
        page: 'home',
        section: 'dimensions',
        block_key: 'conservation',
        text_content: 'Conservar por medio de la fundación.',
      },
      // Statistics Section
      {
        page: 'home',
        section: 'statistics',
        block_key: 'custom_stat_value',
        text_content: '500+',
      },
      {
        page: 'home',
        section: 'statistics',
        block_key: 'custom_stat_name',
        text_content: 'Arboles plantados',
      },
      {
        page: 'home',
        section: 'statistics',
        block_key: 'wokshops_content',
        text_content: 'Talleres realizados por medio de la fundación',
      },
      {
        page: 'home',
        section: 'statistics',
        block_key: 'involved_people',
        text_content: 'Personas involucradas con la fundación',
      },
      // Descriptions Sections
      {
        page: 'home',
        section: 'news',
        block_key: 'description',
        text_content: 'Entérate de nuestras últimas noticias',
      },
      {
        page: 'home',
        section: 'next_events',
        block_key: 'description',
        text_content: 'Entérate de nuestras próximos eventos',
      },
      {
        page: 'home',
        section: 'projects',
        block_key: 'description',
        text_content: 'Entérate de nuestras próximos eventos',
      },
      {
        page: 'home',
        section: 'participating_schools',
        block_key: 'description',
        text_content: 'Estas son las escuelas que participan con nosotros',
      },
      {
        page: 'home',
        section: 'entrepreneurs',
        block_key: 'description',
        text_content: 'Estos son los emprendedores ligados a la fundación',
      },
      {
        page: 'home',
        section: 'fairs',
        block_key: 'description',
        text_content: 'Participa en nuestras ferias, estas son las próximas...',
      },
      {
        page: 'home',
        section: 'involve',
        block_key: 'description',
        text_content: 'Participa en nuestras actividades y campañas. Únete a nuestra misión de transformar comunidades',
      },
      {
        page: 'home',
        section: 'involve',
        block_key: 'volunteer_card',
        text_content: 'Participa en nuestras actividades y campañas. Únete a nuestra misión de transformar comunidades',
      },
      {
        page: 'home',
        section: 'involve',
        block_key: 'donate_card',
        text_content: 'Apoya nuestros proyectos con una contribución.',
      },
      {
        page: 'home',
        section: 'involve',
        block_key: 'entrepreneurship_card',
        text_content: 'Registra tu emprendimiento con nosotros.',
      },
      {
        page: 'home',
        section: 'involve',
        block_key: 'project_card',
        text_content: '¿Tu comunidad necesita un proyecto? Envíanos tu propuesta.',
      },
      {
        page: 'home',
        section: 'newsletter',
        block_key: 'description',
        text_content: 'Suscríbete a nuestro boletín para recibir noticias, eventos y oportunidades.',
      }
    ];

    await this.contentBlockService.updateOrCreateBatch(homeBlocks);

    const teamBlocks = [
      // Presidenta
      { page: 'home', section: 'board_members', block_key: 'president_name', text_content: 'Sra. Lizbeth Cerdas Dinarte' },
      { page: 'home', section: 'board_members', block_key: 'president_photo', image_url: 'https://drive.google.com/thumbnail?id=1e811jszZ26WiotddFYydvIGi3sDShBvZ&sz=w1000' },

      // Vice-Presidenta
      { page: 'home', section: 'board_members', block_key: 'vice_president_name', text_content: 'Yuly Viviana Arenas Vargas' },
      { page: 'home', section: 'board_members', block_key: 'vice_president_photo', image_url: 'https://drive.google.com/thumbnail?id=16pNs8CpwEdckZUroZ7Oer9QAl0TyxevT&sz=w1000' },

      // Director
      { page: 'home', section: 'board_members', block_key: 'director_name', text_content: 'Brandon Barrantes Corea' },
      { page: 'home', section: 'board_members', block_key: 'director_photo', image_url: 'https://drive.google.com/thumbnail?id=1dGqjPxXl4e2JtHRU-HixCSEJK1QHBx9q&sz=w1000' },

      // Tesorera
      { page: 'home', section: 'board_members', block_key: 'treasurer_name', text_content: 'Melissa Vargas Vargas' },
      { page: 'home', section: 'board_members', block_key: 'treasurer_photo', image_url: 'https://drive.google.com/thumbnail?id=1d_Ec6QgTLVyuOayag0najPfrDvcj827P&sz=w1000' },

      // Secretario
      { page: 'home', section: 'board_members', block_key: 'secretary_name', text_content: 'Carlos Roberto Pizarro Barrantes' },
      { page: 'home', section: 'board_members', block_key: 'secretary_photo', image_url: 'https://drive.google.com/thumbnail?id=17_4TcuVTgziOCD7zbjKO2CZ0uMV8JtfJ&sz=w1000' },

      // Vocal
      { page: 'home', section: 'board_members', block_key: 'vocal_name', text_content: 'Carlos Roberto Pizarro Barrantes' },
      { page: 'home', section: 'board_members', block_key: 'vocal_photo', image_url: 'https://drive.google.com/thumbnail?id=1SJql1leOzeYsVRiAkSiDj-ZgDRdCV21C&sz=w1000' },

      { page: 'home', section: 'board_members', block_key: 'executive_representative_name', text_content: 'Leonel Francisco Peralta Barrantes' },
      { page: 'home', section: 'board_members', block_key: 'executive_representative_photo', image_url: 'https://drive.google.com/thumbnail?id=17_4TcuVTgziOCD7zbjKO2CZ0uMV8JtfJ&sz=w1000' },

      { page: 'home', section: 'board_members', block_key: 'municipal_representative_name', text_content: 'Leonel Francisco Peralta Barrantes' },
      { page: 'home', section: 'board_members', block_key: 'municipal_representative_photo', image_url: 'https://drive.google.com/thumbnail?id=1DVyIchX9gh_ret0dZCDpmuwR3SRx2hbu&sz=w1000' },

      { page: 'home', section: 'board_members', block_key: 'coordinator_name', text_content: 'Leonel Francisco Peralta Barrantes' },
      { page: 'home', section: 'board_members', block_key: 'coordinator_photo', image_url: 'https://drive.google.com/thumbnail?id=1dGqos4kUIUazkn6Ah7db2zEVpPhey1tl&sz=w1000' },
    ];
    await this.contentBlockService.updateOrCreateBatch(teamBlocks);
    
  }

  private async seedContactInfo() {
    await this.contactInfoService.get();
  }
}