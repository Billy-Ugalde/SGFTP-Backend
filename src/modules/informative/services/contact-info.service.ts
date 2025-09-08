import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Not, Repository } from "typeorm";
import { UpdateContactInfoDto } from "../dto/update-contact-info.dto";
import { ContactInfo } from "../entities/contact-info.entity";

@Injectable()
export class ContactInfoService {
    constructor(
        @InjectRepository(ContactInfo)
        private readonly contactInfoRepository: Repository<ContactInfo>,
    ) {}

    async get(): Promise<ContactInfo> {
        const contactInfo = await this.contactInfoRepository.find();
        
        if (!contactInfo || contactInfo.length === 0) {
            // Create and return default contact info if none exists
            return await this.createDefaultContactInfo();
        }
        
        return contactInfo[0]; // Siempre devuelve el primer registro
    }

    // contact-info.service.ts
    async update(dto: UpdateContactInfoDto): Promise<ContactInfo> {
        const existing = await this.get();
        
        // Validar que solo existe un registro
        const count = await this.contactInfoRepository.count();
        if (count > 1) {
            throw new BadRequestException('Sistema corrupto: múltiples registros de contacto detectados');
        }
        
        const updated = Object.assign(existing, dto);
        return this.contactInfoRepository.save(updated);
    }

    private async createDefaultContactInfo(): Promise<ContactInfo> {
        // Verificar que no existan registros antes de crear
        const existing = await this.contactInfoRepository.find();
        if (existing.length > 0) {
            return existing[0];
        }
        
        const defaultContact = this.contactInfoRepository.create({
            email: 'contacto@ejemplo.com',
            phone: '+1234567890',
            address: 'Dirección predeterminada',
            facebook_url: 'https://www.facebook.com/TamarindoParkFoundation',
            instagram_url: 'https://www.instagram.com/tamarindoparkfoundation/',
            whatsapp_url: 'https://api.whatsapp.com/send?phone=50664612741',
            youtube_url: 'https://www.youtube.com/@TamarindoParkFoundation',
            google_maps_url: 'https://share.google.com/yCeLkowWNJaPHcjZY'   
        });
        
        return this.contactInfoRepository.save(defaultContact);
    }
}