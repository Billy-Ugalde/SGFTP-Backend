import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { google, drive_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { Readable } from 'stream';

@Injectable()
export class GoogleDriveService {
    private driveClient: drive_v3.Drive;
    private oauth2Client: OAuth2Client;

    constructor() {
        // Configurar OAuth2
        this.oauth2Client = new OAuth2Client(
            process.env.GOOGLE_DRIVE_CLIENT_ID,
            process.env.GOOGLE_DRIVE_CLIENT_SECRET
        );

        // Configurar el refresh token
        if (process.env.GOOGLE_DRIVE_REFRESH_TOKEN) {
            this.oauth2Client.setCredentials({
                refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN
            });
        } else {
            console.warn('⚠️ GOOGLE_DRIVE_REFRESH_TOKEN no configurado. Las subidas a Drive fallarán.');
        }

        this.driveClient = google.drive({ 
            version: 'v3', 
            auth: this.oauth2Client 
        });
    }

    /**
     * Sube un archivo a Google Drive
     * @param file - Archivo de Express Multer
     * @param folderName - Nombre de la carpeta donde guardar
     * @returns URL del archivo y ID de la carpeta
     */
     async uploadFile(file: Express.Multer.File, folderName: string): Promise<{ url: string; folderId: string }> {
        try {
            // Verificar que tenemos refresh token
            if (!process.env.GOOGLE_DRIVE_REFRESH_TOKEN) {
                throw new Error('Google Drive no está configurado correctamente');
            }

            const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;

            // Crear o reutilizar carpeta
            const folderId = await this.getOrCreateFolder(folderName, parentFolderId);

            const bufferStream = new Readable();
            bufferStream.push(file.buffer);
            bufferStream.push(null);

            const uploadedFile = await this.driveClient.files.create({
                requestBody: {
                    name: file.originalname,
                    parents: [folderId],
                },
                media: {
                    mimeType: file.mimetype,
                    body: bufferStream,
                },
                fields: 'id, webViewLink, webContentLink',
            });

            const fileId = uploadedFile.data.id;
            if (!fileId) {
                throw new Error('No se pudo obtener el ID del archivo subido');
            }

            // Hacer el archivo público con permisos amplios
            await this.driveClient.permissions.create({
                fileId,
                requestBody: { 
                    role: 'reader', 
                    type: 'anyone',
                    allowFileDiscovery: false
                },
            });

            const url = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
            
            console.log(`✅ Archivo subido exitosamente:`, {
                fileId: fileId,
                fileName: file.originalname,
                url: url,
                folderId: folderId
            });
            
            return {
                url: url,
                folderId,
            };
        } catch (error) {
            console.error('❌ Error al subir archivo a Drive:', error.message);
            throw new InternalServerErrorException(`Error al subir archivo a Google Drive: ${error.message}`);
        }
    }

    /**
     * Crea o busca una carpeta en Google Drive
     * @param name - Nombre de la carpeta
     * @param parentFolderId - ID de la carpeta padre (opcional)
     * @returns ID de la carpeta
     */
    private async getOrCreateFolder(name: string, parentFolderId?: string): Promise<string> {
        const query = `'${parentFolderId || 'root'}' in parents and name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
        const res = await this.driveClient.files.list({
            q: query,
            fields: 'files(id, name)',
            spaces: 'drive',
        });

        if (res.data.files && res.data.files.length > 0) {
            return res.data.files[0].id!;
        }

        // Crear nueva carpeta
        const fileMetadata: drive_v3.Schema$File = {
            name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: parentFolderId ? [parentFolderId] : undefined,
        };

        const folder = await this.driveClient.files.create({
            requestBody: fileMetadata,
            fields: 'id',
        });

        if (!folder.data.id) {
            throw new InternalServerErrorException('No se pudo crear carpeta en Google Drive');
        }

        return folder.data.id;
    }

    /**
     * Verifica si Google Drive está configurado correctamente
     * @returns true si está configurado
     */
    isConfigured(): boolean {
        return !!(
            process.env.GOOGLE_DRIVE_CLIENT_ID &&
            process.env.GOOGLE_DRIVE_CLIENT_SECRET &&
            process.env.GOOGLE_DRIVE_REFRESH_TOKEN
        );
    }

    /**
 * Elimina un archivo de Google Drive por su ID
 * @param fileId - ID del archivo a eliminar
 */
async deleteFile(fileId: string): Promise<void> {
    try {
        if (!process.env.GOOGLE_DRIVE_REFRESH_TOKEN) {
            throw new Error('Google Drive no está configurado correctamente');
        }

        await this.driveClient.files.delete({
            fileId: fileId
        });
        
        console.log(`✅ Archivo ${fileId} eliminado de Drive`);
    } catch (error) {
        console.error('❌ Error al eliminar archivo de Drive:', error.message);
        // No lanzamos error para no bloquear la operación principal
        // Solo logueamos el error
    }
}

/**
 * Extrae el ID de archivo de una URL de Google Drive
 * @param url - URL del archivo
 * @returns ID del archivo o null si no es válida
 */
 extractFileIdFromUrl(url: string): string | null {
        try {
            // Para URLs de thumbnail
            const thumbnailMatch = url.match(/thumbnail\?id=([^&]+)/);
            if (thumbnailMatch) {
                return thumbnailMatch[1];
            }
            
            // Para URLs con uc?export=view
            const ucMatch = url.match(/[?&]id=([^&]+)/);
            if (ucMatch) {
                return ucMatch[1];
            }
            
            // Para URLs de visualización: https://drive.google.com/file/d/FILE_ID/view
            const fileMatch = url.match(/\/d\/([^\/]+)/);
            if (fileMatch) {
                return fileMatch[1];
            }
            
            return null;
        } catch {
            return null;
        }
    }
     /**
     * Convierte una URL antigua de Drive al nuevo formato
     * @param oldUrl - URL antigua
     * @returns URL nueva o la misma si no se puede convertir
     */
    convertToThumbnailUrl(oldUrl: string): string {
        const fileId = this.extractFileIdFromUrl(oldUrl);
        if (fileId) {
            return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
        }
        return oldUrl;
    }
    
}