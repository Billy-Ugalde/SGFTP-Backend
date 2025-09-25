import { Controller, Get, Query, Res, HttpException, HttpStatus, Header } from '@nestjs/common';
import { Response } from 'express';
import { Public } from 'src/modules/auth/decorators/public.decorator';
import axios from 'axios';

@Controller('images')
export class ImageProxyController {
    
    @Get('proxy')
    @Public()
    @Header('Cache-Control', 'public, max-age=86400') 
    async proxyImage(@Query('url') url: string, @Res() res: Response) {
        if (!url) {
            throw new HttpException('URL is required', HttpStatus.BAD_REQUEST);
        }

        try {
            console.log('📸 Proxy request for:', url);
            
            // Extraer el ID del archivo de la URL
            let fileId: string | null = null;
            
            // Intentar diferentes patrones de extracción
            const patterns = [
                /thumbnail\?id=([^&]+)/,
                /[?&]id=([^&]+)/,
                /\/d\/([^\/]+)/
            ];
            
            for (const pattern of patterns) {
                const match = url.match(pattern);
                if (match) {
                    fileId = match[1];
                    break;
                }
            }
            
            if (!fileId) {
                throw new HttpException('Invalid Google Drive URL', HttpStatus.BAD_REQUEST);
            }
            
            // Usar la URL de thumbnail que funciona mejor
            const googleUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
            
            console.log('📸 Fetching from Google:', googleUrl);
            
            // Obtener la imagen de Google Drive
            const response = await axios.get(googleUrl, {
                responseType: 'stream',
                timeout: 15000, // 15 segundos timeout
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': 'https://drive.google.com/'
                },
                maxRedirects: 5
            });

            // Configurar headers de respuesta
            res.set({
                'Content-Type': response.headers['content-type'] || 'image/jpeg',
                'Cache-Control': 'public, max-age=86400', 
                'Access-Control-Allow-Origin': '*',
                'X-Proxied-From': 'google-drive'
            });


            response.data.pipe(res);
            
        } catch (error) {
            console.error('❌ Error proxying image:', error.message);
            
            // Si es error de axios, intentar dar más detalles
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response headers:', error.response.headers);
            }
            
            // Enviar una imagen de placeholder en caso de error
            res.status(HttpStatus.NOT_FOUND).json({
                error: 'Failed to load image',
                message: 'The image could not be loaded from Google Drive'
            });
        }
    }
}