import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Request
} from '@nestjs/common';
import { NewsletterService } from './services/newsletter.service';
import { SendCampaignDto } from './dto/send-campaign.dto';
import { CampaignLanguage } from './entities/newsletter-campaign.entity';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@Controller('newsletters')
@UseGuards(AuthGuard)
export class NewslettersController {
  constructor(private readonly newsletterService: NewsletterService) {}

  // Get count of subscribers by language
  @Get('subscribers/count')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.CONTENT_ADMIN)
  async getSubscribersCount(
    @Query('language') language: CampaignLanguage
  ) {
    const count = await this.newsletterService.getSubscribersCount(language);
    return { count };
  }

  // Get list of subscribers by language
  @Get('subscribers/list')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.CONTENT_ADMIN)
  async getSubscribersList(
    @Query('language') language: CampaignLanguage
  ) {
    const subscribers = await this.newsletterService.getSubscribersList(language);
    return { subscribers };
  }

  // Send campaign
  @Post('send')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.CONTENT_ADMIN)
  async sendCampaign(
    @Body() sendCampaignDto: SendCampaignDto,
    @Request() req: any
  ) {
    const userId = req.user.id_user;
    return this.newsletterService.sendCampaign(sendCampaignDto, userId);
  }

  // Get campaign history (paginated)
  @Get('campaigns')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.CONTENT_ADMIN)
  async getCampaigns(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    return this.newsletterService.getCampaigns(page, limit);
  }

  // Get specific campaign details
  @Get('campaigns/:id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.CONTENT_ADMIN)
  async getCampaignById(@Param('id', ParseIntPipe) id: number) {
    return this.newsletterService.getCampaignById(id);
  }
}
