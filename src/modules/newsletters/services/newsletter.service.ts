import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { NewsletterCampaign, CampaignLanguage, CampaignStatus } from '../entities/newsletter-campaign.entity';
import { Subscriber, PreferredLanguage } from '../../subscribers/entities/subscriber.entity';
import { User } from '../../users/entities/user.entity';
import { NewsletterTemplateService } from './newsletter-template.service';
import { SendCampaignDto } from '../dto/send-campaign.dto';

@Injectable()
export class NewsletterService {
  private transporter: any;

  constructor(
    @InjectRepository(NewsletterCampaign)
    private campaignRepository: Repository<NewsletterCampaign>,
    @InjectRepository(Subscriber)
    private subscriberRepository: Repository<Subscriber>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private templateService: NewsletterTemplateService,
    private configService: ConfigService,
  ) {
    this.initializeTransporter();
  }

  private async initializeTransporter() {
    try {
      const nodemailer = require('nodemailer');

      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: this.configService.get('EMAIL_USER'),
          pass: this.configService.get('EMAIL_PASS'),
        },
      });

      await this.transporter.verify()
        .then(() => console.log('✅ Newsletter SMTP initialized'))
        .catch((error: any) => console.error('❌ Newsletter SMTP error:', error.message));

    } catch (error: any) {
      console.error('❌ Error initializing Newsletter SMTP:', error.message);
    }
  }

  // Get count of subscribers by language
  async getSubscribersCount(language: CampaignLanguage): Promise<number> {
    const langMapping = {
      [CampaignLanguage.SPANISH]: PreferredLanguage.SPANISH,
      [CampaignLanguage.ENGLISH]: PreferredLanguage.ENGLISH
    };

    return await this.subscriberRepository.count({
      where: { preferredLanguage: langMapping[language] }
    });
  }

  // Get list of subscribers by language
  async getSubscribersList(language: CampaignLanguage) {
    const langMapping = {
      [CampaignLanguage.SPANISH]: PreferredLanguage.SPANISH,
      [CampaignLanguage.ENGLISH]: PreferredLanguage.ENGLISH
    };

    const subscribers = await this.subscriberRepository.find({
      where: { preferredLanguage: langMapping[language] },
      order: { createdAt: 'DESC' }
    });

    return subscribers.map(sub => ({
      id: sub.id,
      email: sub.email,
      firstName: sub.firstName,
      lastName: sub.lastName,
      preferredLanguage: sub.preferredLanguage,
      createdAt: sub.createdAt
    }));
  }

  // Send campaign to all subscribers with specified language
  async sendCampaign(dto: SendCampaignDto, userId: number) {
    const user = await this.userRepository.findOne({
      where: { id_user: userId },
      relations: ['person']
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get all subscribers for the specified language
    const langMapping = {
      [CampaignLanguage.SPANISH]: PreferredLanguage.SPANISH,
      [CampaignLanguage.ENGLISH]: PreferredLanguage.ENGLISH
    };

    const subscribers = await this.subscriberRepository.find({
      where: { preferredLanguage: langMapping[dto.language] }
    });

    // Create campaign record
    const campaign = this.campaignRepository.create({
      subject: dto.subject,
      content: dto.content,
      language: dto.language,
      sentBy: user,
      totalRecipients: subscribers.length,
      successfulSends: 0,
      failedSends: 0,
      status: CampaignStatus.COMPLETED,
      errors: []
    });

    // Send emails to all subscribers
    const errors: string[] = [];
    let successCount = 0;
    let failCount = 0;

    for (const subscriber of subscribers) {
      try {
        await this.sendEmailToSubscriber(subscriber, dto.subject, dto.content, dto.language);
        successCount++;
      } catch (error: any) {
        failCount++;
        errors.push(`Failed to send to ${subscriber.email}: ${error.message}`);
      }
    }

    campaign.successfulSends = successCount;
    campaign.failedSends = failCount;
    campaign.errors = errors.length > 0 ? errors : null;

    if (failCount === 0) {
      campaign.status = CampaignStatus.COMPLETED;
    } else if (successCount === 0) {
      campaign.status = CampaignStatus.FAILED;
    } else {
      campaign.status = CampaignStatus.PARTIAL;
    }

    const savedCampaign = await this.campaignRepository.save(campaign);

    return {
      id: savedCampaign.id,
      totalRecipients: savedCampaign.totalRecipients,
      successfulSends: savedCampaign.successfulSends,
      failedSends: savedCampaign.failedSends,
      status: savedCampaign.status,
      errors: savedCampaign.errors
    };
  }

  private async sendEmailToSubscriber(
    subscriber: Subscriber,
    subject: string,
    content: string,
    language: CampaignLanguage
  ): Promise<void> {
    if (!this.transporter) {
      await this.initializeTransporter();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const recipientName = `${subscriber.firstName} ${subscriber.lastName}`;
    const htmlContent = this.templateService.generateNewsletterEmail(
      recipientName,
      subject,
      content,
      language
    );

    const mailOptions = {
      from: `"Fundación Tamarindo Park" <${this.configService.get('EMAIL_FROM')}>`,
      to: subscriber.email,
      subject: subject,
      html: htmlContent,
    };

    await this.transporter.verify();
    await this.transporter.sendMail(mailOptions);
  }

  async getCampaigns(page: number = 1, limit: number = 5) {
    const [campaigns, total] = await this.campaignRepository.findAndCount({
      relations: ['sentBy', 'sentBy.person'],
      order: { sentAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit
    });

    return {
      campaigns: campaigns.map(campaign => ({
        id: campaign.id,
        subject: campaign.subject,
        language: campaign.language,
        totalRecipients: campaign.totalRecipients,
        successfulSends: campaign.successfulSends,
        failedSends: campaign.failedSends,
        status: campaign.status,
        sentAt: campaign.sentAt,
        sentBy: campaign.sentBy ? {
          name: `${campaign.sentBy.person.first_name} ${campaign.sentBy.person.first_lastname}`,
          email: campaign.sentBy.person.email
        } : null
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getCampaignById(id: number) {
    const campaign = await this.campaignRepository.findOne({
      where: { id },
      relations: ['sentBy', 'sentBy.person']
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    return {
      id: campaign.id,
      subject: campaign.subject,
      content: campaign.content,
      language: campaign.language,
      totalRecipients: campaign.totalRecipients,
      successfulSends: campaign.successfulSends,
      failedSends: campaign.failedSends,
      status: campaign.status,
      sentAt: campaign.sentAt,
      errors: campaign.errors,
      sentBy: campaign.sentBy ? {
        name: `${campaign.sentBy.person.first_name} ${campaign.sentBy.person.first_lastname}`,
        email: campaign.sentBy.person.email
      } : null
    };
  }
}
