import { Controller, Post, Get, Patch, Put, Body, Param, ParseIntPipe } from "@nestjs/common";
import { FairService } from "../services/fair.service";
import { fairDto } from "../dto/createFair.dto";
import { UpdatefairDto } from "../dto/updateFair.dto";
import { Fair } from "../entities/fair.entity";
import { fairStatusDto } from "../dto/fair-status.dto";

@Controller('fairs')
export class FairController {

    constructor(private readonly fairService: FairService) { }

    @Post()
    create(@Body() createFair: fairDto): Promise<Fair> {
        return this.fairService.create(createFair);
    }

    @Get()
    getall(): Promise<Fair[]> {
        return this.fairService.getAll();
    }

    @Get(':id_fair')
    getOne(@Param('id_fair', ParseIntPipe) id_fair: number) {
        return this.fairService.getOne(id_fair);
    }

    @Put(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() updateFair: UpdatefairDto) {
        return this.fairService.update(id, updateFair);
    }

    @Patch(':id',)
    updateStatus(
        @Param('id', ParseIntPipe) id: number,
        @Body() statusData: fairStatusDto
    ) {
        return this.fairService.updateStatus(id, statusData.status);
    }
}