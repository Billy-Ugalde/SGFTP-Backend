import { Injectable, NotFoundException } from "@nestjs/common";
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

    async update(dto: UpdateContactInfoDto): Promise<ContactInfo> {
        const existing = await this.get();
        const updated = Object.assign(existing, dto);
        return this.contactInfoRepository.save(updated);
    }

    private async createDefaultContactInfo(): Promise<ContactInfo> {
        const defaultContact = this.contactInfoRepository.create({
            email: 'contacto@ejemplo.com',
            phone: '+1234567890',
            address: 'Dirección predeterminada',
            facebook_url: 'https://www.facebook.com/TamarindoParkFoundation',
            instagram_url: 'https://www.instagram.com/tamarindoparkfoundation/',
            whatsapp_url: 'https://api.whatsapp.com/send?phone=50664612741',
            youtube_url: 'https://www.youtube.com/@TamarindoParkFoundation',
            google_maps_url: 'https://share.google/yCeLkowWNJaPHcjZY'   
        });
        
        return this.contactInfoRepository.save(defaultContact);
    }
}

/**git commit -m 'Refactorización del backend de gestión informativa, servicios de información de contacto y noticias' */