import { Controller, Get, Query, Res, HttpException, HttpStatus, Header } from '@nestjs/common';
import { Response } from 'express';
import { Public } from 'src/modules/auth/decorators/public.decorator';
import { GoogleDriveService } from './google-drive.service';

@Controller('images')
export class ImageProxyController {

    constructor(private readonly googleDriveService: GoogleDriveService) {}

    @Get('proxy')
    @Public()
    @Header('Cache-Control', 'public, max-age=86400')
    async proxyImage(@Query('url') url: string, @Res() res: Response) {
        if (!url) {
            throw new HttpException('URL is required', HttpStatus.BAD_REQUEST);
        }

        const fileId = this.googleDriveService.extractFileIdFromUrl(url);

        if (!fileId) {
            throw new HttpException('Invalid Google Drive URL', HttpStatus.BAD_REQUEST);
        }

        try {
            const { data, contentType } = await this.googleDriveService.getFileStream(fileId);

            res.set({
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400',
                'Access-Control-Allow-Origin': '*',
                'X-Proxied-From': 'google-drive'
            });

            data.pipe(res);

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error('❌ Error proxying image:', message);
            res.status(HttpStatus.NOT_FOUND).json({
                error: 'Failed to load image',
                message: 'The image could not be loaded from Google Drive'
            });
        }
    }
}
