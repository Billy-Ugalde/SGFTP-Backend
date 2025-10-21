import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  ParseIntPipe,
  UseInterceptors,
  UploadedFiles
} from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { MailboxService } from "../services/mailbox.service";
import { CreateMailboxDto } from "../dto/createMailbox.dto";
import { UpdateMailboxDto } from "../dto/updateMailbox.dto";
import { MailboxFiles } from "../interfaces/mailbox.interface";
import { ParseJsonFieldsInterceptor } from "src/common/interceptors/parse-json-fields.interceptor";


@Controller('mailbox')
export class MailboxController {
  constructor(private readonly mailboxService: MailboxService) { }

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'documents', maxCount: 3 }
    ]),
    ParseJsonFieldsInterceptor
  )
  async createMailbox(
    @Body() createMailboxDto: CreateMailboxDto,
    @UploadedFiles() files: { documents?: Express.Multer.File[] }
  ) {
    return await this.mailboxService.createMailbox(
      createMailboxDto,
      files?.documents
    );
  }

  @Put(':id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'Document1_file', maxCount: 1 },
      { name: 'Document2_file', maxCount: 1 },
      { name: 'Document3_file', maxCount: 1 },
      { name: 'documents', maxCount: 3 }
    ]),
    ParseJsonFieldsInterceptor
  )
  async updateMailbox(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMailboxDto: UpdateMailboxDto,
    @UploadedFiles() files: MailboxFiles
  ) {
    return await this.mailboxService.updateMailbox(id, updateMailboxDto, files);
  }

  @Get()
  async getAllMailbox() {
    return await this.mailboxService.getAllMailbox();
  }

  @Get(':id')
  async getMailboxById(@Param('id', ParseIntPipe) id: number) {
    return await this.mailboxService.getMailboxById(id);
  }
}