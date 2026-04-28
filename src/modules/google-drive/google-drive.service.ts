import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { google, drive_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { Readable } from 'stream';
import { FolderCategory, FOLDER_NAME_TO_CATEGORY } from './enums/folder-categories.enum';

@Injectable()
export class GoogleDriveService {
    private driveClient: drive_v3.Drive;
    private oauth2Client: OAuth2Client;
    private categoryFolderCache: Map<FolderCategory, string> = new Map();

    constructor() {
        this.oauth2Client = new OAuth2Client(
            process.env.GOOGLE_DRIVE_CLIENT_ID,
            process.env.GOOGLE_DRIVE_CLIENT_SECRET
        );

        if (process.env.GOOGLE_DRIVE_REFRESH_TOKEN) {
            this.oauth2Client.setCredentials({
                refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN
            });

            this.oauth2Client.on('tokens', (tokens) => {
                if (tokens.refresh_token) {
                    // manejar la recepción de un nuevo refresh token si es necesario
                }
            });
        }

        this.driveClient = google.drive({
            version: 'v3',
            auth: this.oauth2Client
        });
    }

    private detectFolderCategory(folderName: string): FolderCategory | null {
        const prefix = folderName.split('_')[0].toLowerCase();
        return FOLDER_NAME_TO_CATEGORY[prefix] || null;
    }


    private async getOrCreateCategoryFolder(category: FolderCategory): Promise<string> {
        
        if (this.categoryFolderCache.has(category)) {
            return this.categoryFolderCache.get(category)!;
        }

        const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;
        const categoryFolderId = await this.getOrCreateFolder(category, parentFolderId);

        this.categoryFolderCache.set(category, categoryFolderId);

        return categoryFolderId;
    }

    async uploadFile(file: Express.Multer.File, folderName: string): Promise<{ url: string; folderId: string }> {
        try {
            if (!process.env.GOOGLE_DRIVE_REFRESH_TOKEN) {
                throw new Error('Google Drive no está configurado correctamente');
            }

            await this.ensureValidToken();

            const category = this.detectFolderCategory(folderName);

            let folderId: string;

            if (category) {
                const categoryFolderId = await this.getOrCreateCategoryFolder(category);
                folderId = await this.getOrCreateFolder(folderName, categoryFolderId);
            } else {
                const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;
                folderId = await this.getOrCreateFolder(folderName, parentFolderId);
            }

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

            await this.driveClient.permissions.create({
                fileId,
                requestBody: {
                    role: 'reader',
                    type: 'anyone',
                    allowFileDiscovery: false
                },
            });

            const url = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;

            return {
                url: url,
                folderId,
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error desconocido';
            throw new InternalServerErrorException(`Error al subir archivo a Google Drive: ${message}`);
        }
    }

    private async ensureValidToken(): Promise<void> {
        try {
            const { token } = await this.oauth2Client.getAccessToken();
            if (!token) {
                throw new Error('No se pudo obtener un access token válido');
            }
        } catch (error) {
            throw new InternalServerErrorException(
                'Error de autenticación con Google Drive. Verifica tu refresh token.'
            );
        }
    }

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

    async getFileStream(fileId: string): Promise<{ data: Readable; contentType: string }> {
        await this.ensureValidToken();
        const response = await (this.driveClient.files.get as any)(
            { fileId, alt: 'media' },
            { responseType: 'stream' }
        );
        const contentType: string = response.headers?.['content-type'] ?? 'image/jpeg';
        return { data: response.data as Readable, contentType };
    }

    isConfigured(): boolean {
        return !!(
            process.env.GOOGLE_DRIVE_CLIENT_ID &&
            process.env.GOOGLE_DRIVE_CLIENT_SECRET &&
            process.env.GOOGLE_DRIVE_REFRESH_TOKEN
        );
    }

    async deleteFile(fileId: string): Promise<void> {
        try {
            if (!process.env.GOOGLE_DRIVE_REFRESH_TOKEN) {
                throw new Error('Google Drive no está configurado correctamente');
            }

            await this.ensureValidToken();

            await this.driveClient.files.delete({
                fileId: fileId
            });
        } catch (error) {
            // Solo capturamos el error sin lanzarlo
        }
    }

    extractFileIdFromUrl(url: string): string | null {
        try {
            const thumbnailMatch = url.match(/thumbnail\?id=([^&]+)/);
            if (thumbnailMatch) {
                return thumbnailMatch[1];
            }
            
            const ucMatch = url.match(/[?&]id=([^&]+)/);
            if (ucMatch) {
                return ucMatch[1];
            }
            
            const fileMatch = url.match(/\/d\/([^\/]+)/);
            if (fileMatch) {
                return fileMatch[1];
            }
            
            return null;
        } catch {
            return null;
        }
    }

    convertToThumbnailUrl(oldUrl: string): string {
        const fileId = this.extractFileIdFromUrl(oldUrl);
        if (fileId) {
            return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
        }
        return oldUrl;
    }
}