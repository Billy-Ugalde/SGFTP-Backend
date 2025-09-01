import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('contact_info')
export class ContactInfo {
    @PrimaryGeneratedColumn()
    id_contact_info: number;

    @Column({ type: 'varchar', length: 255 })
    email: string;

    @Column({ type: 'varchar', length: 20 })
    phone: string;  

    @Column({ type: 'varchar', length: 255 })
    address: string;

    @Column({ type: 'varchar', length: 255 })
    facebook_url: string;

    @Column({ type: 'varchar', length: 255})
    instagram_url: string;   

    @Column({ type: 'varchar', length: 255})
    whatsapp_url: string;

    @Column({ type: 'varchar', length: 255})
    youtube_url: string;

    @Column({ type: 'varchar', length: 255 })
    google_maps_url: string;


    @Column({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',     
        onUpdate: 'CURRENT_TIMESTAMP',
        name: 'last_updated'
    })
    lastUpdated: Date;
}
