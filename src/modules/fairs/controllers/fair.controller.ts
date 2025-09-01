import { Controller, Post, Get, Patch, Put, Body, Param, ParseIntPipe, HttpCode, HttpStatus } from "@nestjs/common";
import { FairService } from "../services/fair.service";
import { fairDto } from "../dto/createFair.dto";
import { UpdatefairDto } from "../dto/updateFair.dto";
import { Fair } from "../entities/fair.entity";
import { fairStatusDto } from "../dto/fair-status.dto";

@Controller('fairs')
export class FairController {

    constructor(private readonly fairService: FairService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body()
        createFair: fairDto): Promise<Fair> {
        return await this.fairService.create(createFair);
    }

    @Get()
    async getall(): Promise<Fair[]> {
        return await this.fairService.getAll();
    }

    @Get(':id')
    async getOne(@Param('id', ParseIntPipe) id_fair: number): Promise<Fair> {
        return await this.fairService.getOne(id_fair);
    }

    @Put(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateFair: UpdatefairDto): Promise<Fair> {
        return await this.fairService.update(id, updateFair);
    }

    @Patch(':id')
    async updateStatus(
        @Param('id', ParseIntPipe) id: number,
        @Body() fairstatus: fairStatusDto
    ): Promise<Fair> {
        return  await this.fairService.updateStatus(id, fairstatus);
    }
}