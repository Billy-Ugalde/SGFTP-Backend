import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HeroSection } from "./entities/hero-section.entity";
import { NewsletterSection } from "./entities/newsletter-section.entity";               
import { InvolveSection } from "./entities/involve-section.entity";
import { InformativeController } from "./informative.controller";
import { InvolveCard } from "./entities/involve-card.entity";
import { SectionDescription } from "./entities/section-description.entity";
import { ValueProposition } from "./entities/value-proposition.entity";
import { HeroSectionService } from "./services/hero-section.service";
import { NewsletterSectionService } from "./services/newsletter-section.service";
import { InvolveSectionService } from "./services/involve-section.service"; 
import { InvolveCardService } from "./services/involve-card.service";
import { SectionDescriptionService } from "./services/section-description.service"; 
import { ValuePropositionService } from "./services/value-proposition.service";

@Module({
    imports: [TypeOrmModule.forFeature([HeroSection, SectionDescription, ValueProposition, 
                                        InvolveCard, InvolveSection, NewsletterSection])],
    controllers: [InformativeController],
    providers: [HeroSectionService, ValuePropositionService, 
                NewsletterSectionService, InvolveSectionService,
                InvolveCardService, SectionDescriptionService]
})
export class InformativeModule { }