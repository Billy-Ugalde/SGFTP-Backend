import { DataSource } from 'typeorm';
import { HeroSection } from '../modules/informative/entities/hero-section.entity';
import { ValueProposition } from '../modules/informative/entities/value-proposition.entity';
import { SectionDescription } from '../modules/informative/entities/section-description.entity';
import { InvolveSection } from '../modules/informative/entities/involve-section.entity';    
import { InvolveCard } from '../modules/informative/entities/involve-card.entity';
import { NewsletterSection } from '../modules/informative/entities/newsletter-section.entity';


export const seedInformativePage = async (dataSource: DataSource) => {
  const heroRepo = dataSource.getRepository(HeroSection);
  const valueRepo = dataSource.getRepository(ValueProposition);
  const sectionRepo = dataSource.getRepository(SectionDescription);
  const involveRepo = dataSource.getRepository(InvolveSection);
  const cardRepo = dataSource.getRepository(InvolveCard);
  const newsletterRepo = dataSource.getRepository(NewsletterSection);

  // Hero Section
  if (!(await heroRepo.findOneBy({ id: 'hero' }))) {
    await heroRepo.save(heroRepo.create({
      id: 'hero',
      title: 'Tamarindo Park Foundation',
      subtitle: 'Tu voz, nuestro proyecto',
      description: 'Transformando comunidades a través del desarrollo sostenible integral',
      backgroundImage: 'https://corporate.walmart.com/content/corporate/en_us/purpose/sustainability/planet/nature/jcr:content/par/image_2_0.img.png/1693432526985.png',
    }));
  }

  // Value Proposition
  if (!(await valueRepo.findOneBy({ id: 'value_proposition' }))) {
    await valueRepo.save(valueRepo.create({
      id: 'value_proposition',
      sectionTitle: 'Nuestra Propuesta de Valor',
      missionTitle: 'Misión',
      missionContent: 'Transformar la coexistencia entre comunidades y entorno...',
      visionTitle: 'Meta',
      visionContent: 'Ser una ONG referente en desarrollo sostenible e inclusivo.',
      impactTitle: 'Impacto',
      impactTags: ['Social', 'Cultural', 'Ambiental'],
      dimensionsTitle: 'Dimensiones',
      dimensionsTags: ['Desarrollo Local', 'Educación', 'Prevención', 'Conservación']
    }));
  }

  // Section Descriptions
  const sections = [
    { id: 'news_section', title: 'Últimas Noticias', description: undefined },
    { id: 'events_section', title: 'Próximos Eventos', description: undefined },
    { id: 'projects_section', title: 'Proyectos Realizados', description: undefined },
    {
      id: 'schools_section',
      title: 'Escuelas Participantes',
      description: 'Reconocemos el esfuerzo de las escuelas que participan...'
    },
    {
      id: 'entrepreneurs_section',
      title: 'Emprendedores Locales',
      description: 'Apoyamos el talento local y la preservación de tradiciones.'
    },
  ];

  for (const section of sections) {
    if (!(await sectionRepo.findOneBy({ id: section.id }))) {
      await sectionRepo.save(sectionRepo.create(section));
    }
  }

  // Involve Section
  if (!(await involveRepo.findOneBy({ id: 'involve_section' }))) {
    await involveRepo.save(involveRepo.create({
      id: 'involve_section',
      title: '¡Involúcrate con Nosotros!',
      description: 'Únete a nuestra misión de transformar comunidades.'
    }));
  }

  // Involve Cards
  const cards = [
    {
      id: 'volunteer',
      title: 'Ser Voluntario',
      description: 'Participa en nuestras actividades y campañas.',
      buttonText: 'Quiero ser Voluntario'
    },
    {
      id: 'donation',
      title: 'Hacer una Donación',
      description: 'Apoya nuestros proyectos con una contribución.',
      buttonText: 'Quiero Donar'
    },
    {
      id: 'entrepreneur',
      title: 'Ser Emprendedor',
      description: 'Forma parte de nuestra red de emprendedores.',
      buttonText: 'Registrar Emprendimiento'
    },
    {
      id: 'project',
      title: 'Solicitar Proyecto',
      description: '¿Tu comunidad necesita un proyecto?',
      buttonText: 'Proponer Proyecto'
    }
  ];

  for (const card of cards) {
    if (!(await cardRepo.findOneBy({ id: card.id }))) {
      await cardRepo.save(cardRepo.create(card));
    }
  }

  // Newsletter
  if (!(await newsletterRepo.findOneBy({ id: 'newsletter_section' }))) {
    await newsletterRepo.save(newsletterRepo.create({
      id: 'newsletter_section',
      title: 'Mantente Informado',
      description: 'Suscríbete a nuestro boletín...',
      privacyNote: 'Nos comprometemos a respetar tu privacidad.'
    }));
  }

  console.log('✔️ Informative page content seeded.');
};
