import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { HeroSectionService } from './services/hero-section.service';
import { ValuePropositionService } from './services/value-proposition.service';
import { SectionDescriptionService } from './services/section-description.service';
import { InvolveSectionService } from './services/involve-section.service';
import { InvolveCardService } from './services/involve-card.service';
import { NewsletterSectionService } from './services/newsletter-section.service';

import { UpdateHeroDto } from './dto/update-hero.dto';
import { UpdateValuePropositionDto } from './dto/update-value-proposition.dto';
import { UpdateSectionDescriptionDto } from './dto/update-section-description.dto';
import { UpdateInvolveSectionDto } from './dto/update-involve-section.dto';
import { UpdateInvolveCardDto } from './dto/update-involve-card.dto';
import { UpdateNewsletterDto } from './dto/update-newsletter.dto';

@Controller('informative')
export class InformativeController {
  constructor(
    private readonly heroService: HeroSectionService,
    private readonly valueService: ValuePropositionService,
    private readonly sectionService: SectionDescriptionService,
    private readonly involveService: InvolveSectionService,
    private readonly cardService: InvolveCardService,
    private readonly newsletterService: NewsletterSectionService,
  ) {}

  // ─── Hero Section ────────────────────────────────

  @Get('hero')
  getHero() {
    return this.heroService.get();
  }

  @Patch('hero')
  updateHero(@Body() dto: UpdateHeroDto) {
    return this.heroService.update(dto);
  }

  // ─── Value Proposition ───────────────────────────

  @Get('value-proposition')
  getValueProposition() {
    return this.valueService.get();
  }

  @Patch('value-proposition')
  updateValueProposition(@Body() dto: UpdateValuePropositionDto) {
    return this.valueService.update(dto);
  }

  // ─── Section Descriptions (news, events...) ──────

  @Get('section/:id')
  getSectionDescription(@Param('id') id: string) {
    return this.sectionService.get(id);
  }

  @Patch('section/:id')
  updateSectionDescription(
    @Param('id') id: string,
    @Body() dto: UpdateSectionDescriptionDto
  ) {
    return this.sectionService.update(id, dto);
  }

  // ─── Involve Section ─────────────────────────────

  @Get('involve')
  getInvolveSection() {
    return this.involveService.get();
  }

  @Patch('involve')
  updateInvolveSection(@Body() dto: UpdateInvolveSectionDto) {
    return this.involveService.update(dto);
  }

  // ─── Involve Cards ───────────────────────────────

  @Get('involve/cards')
  getAllInvolveCards() {
    return this.cardService.findAll();
  }

  @Post('involve/cards')
  upsertInvolveCard(@Body() dto: UpdateInvolveCardDto) {
    return this.cardService.upsert(dto);
  }

  // ─── Newsletter Section ──────────────────────────

  @Get('newsletter')
  getNewsletterSection() {
    return this.newsletterService.get();
  }

  @Patch('newsletter')
  updateNewsletterSection(@Body() dto: UpdateNewsletterDto) {
    return this.newsletterService.update(dto);
  }
}
