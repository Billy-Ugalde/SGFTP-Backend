/**
 * Categorías de carpetas en Google Drive
 * Definición de la estructura organizacional de carpetas para el sistema
 */
export enum FolderCategory {
  ENTREPRENEURS = 'Emprendedores',
  PROJECTS = 'Proyectos',
  ACTIVITIES = 'Actividades',
  NEWS = 'Noticias',
  MAILBOX = 'Buzon',
  BOARD_MEMBERS = 'Junta_Directiva',
  HERO_IMAGES = 'Imagenes_Hero',
  BANK_ACCOUNTS = 'Cuentas_Bancarias',
}

/**
 * Mapeo de nombres de carpetas individuales a sus categorías padre
 */
export const FOLDER_NAME_TO_CATEGORY: Record<string, FolderCategory> = {
  // Emprendedores
  entrepreneur: FolderCategory.ENTREPRENEURS,

  // Proyectos
  project: FolderCategory.PROJECTS,

  // Actividades
  activity: FolderCategory.ACTIVITIES,

  // Noticias
  news: FolderCategory.NEWS,

  // Buzón (documentos enviados por voluntarios)
  mailbox: FolderCategory.MAILBOX,

  // Junta directiva
  board_members: FolderCategory.BOARD_MEMBERS,

  // Hero
  hero: FolderCategory.HERO_IMAGES,

  // Cuentas bancarias
  bank: FolderCategory.BANK_ACCOUNTS,
};
