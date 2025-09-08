import { Controller, Get, Patch,Body } from '@nestjs/common';
import { ContactInfoService } from '../services/contact-info.service';
import { UpdateContactInfoDto } from '../dto/update-contact-info.dto';

@Controller('contact-info')
export class ContactInfoController {
  constructor(private readonly contactInfoService: ContactInfoService) {}

  @Get()
  get() {
    return this.contactInfoService.get();
  }

  @Patch()
  update(@Body() updateDto: UpdateContactInfoDto) {
    return this.contactInfoService.update(updateDto);
  }
}