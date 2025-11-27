import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  ParseIntPipe,
  UseInterceptors,
  UploadedFiles,
  HttpCode,
  HttpStatus,
  UseGuards
} from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { MailboxService } from "../services/mailbox.service";
import { CreateMailboxDto } from "../dto/createMailbox.dto";
import { UpdateMailboxDto } from "../dto/updateMailbox.dto";
import { MailboxFiles } from "../interfaces/mailbox.interface";
import { ParseJsonFieldsInterceptor } from "src/common/interceptors/parse-json-fields.interceptor";
import { AuthGuard } from "src/modules/auth/guards/auth.guard";
import { RoleGuard } from "src/modules/auth/guards/role.guard";
import { Roles } from "src/modules/auth/decorators/roles.decorator";
import { UserRole } from "src/modules/auth/enums/user-role.enum";

@Controller('mailbox')
@UseGuards(AuthGuard)
export class MailboxController {
  constructor(private readonly mailboxService: MailboxService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RoleGuard)
  @Roles(UserRole.VOLUNTEER, UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN)
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
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN)
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
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.AUDITOR, UserRole.VOLUNTEER)
  async getAllMailbox() {
    return await this.mailboxService.getAllMailbox();
  }

  @Get(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.AUDITOR)
  async getMailboxById(@Param('id', ParseIntPipe) id: number) {
    return await this.mailboxService.getMailboxById(id);
  }
}