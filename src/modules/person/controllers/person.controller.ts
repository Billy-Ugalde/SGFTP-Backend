import { Controller, Get, Post, Body, Param, Put, Delete, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { PersonService } from '../services/person.service';
import { CreatePersonDto, UpdatePersonDto } from '../dto/person.dto';
import { Person } from '../../../entities/person.entity';
import { DataSource } from 'typeorm';

@Controller('people')
export class PersonController {
  constructor(
    private readonly personService: PersonService,
    private dataSource: DataSource,
  ) { }


  @Get()
  async findAll(): Promise<Person[]> {
    return this.personService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<Person> {
    const person = await this.personService.findById(+id);
    if (!person) {
      throw new NotFoundException(`Persona con ID ${id} no encontrada`);
    }
    return person;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreatePersonDto): Promise<Person> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const savedPerson = await this.personService.create(createDto, queryRunner);
      await queryRunner.commitTransaction();
      return savedPerson;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }



  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdatePersonDto,
  ): Promise<Person> {
    const personId = +id;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Validar si la persona existe ANTES de actualizar
      const existingPerson = await this.personService.findById(personId);
      if (!existingPerson) {
        throw new NotFoundException(`Persona con ID ${personId} no encontrada`);
      }

      // 2. Ejecutar la actualización dentro de la transacción
      await this.personService.update(personId, updateDto, queryRunner);
      await queryRunner.commitTransaction();

      // 3. Obtener la persona actualizada y validarla antes de retornar
      const updatedPerson = await this.personService.findById(personId);
      if (!updatedPerson) {
        // Este caso es muy improbable, pero por seguridad se valida
        throw new NotFoundException(`Persona con ID ${personId} no encontrada`);
      }

      return updatedPerson;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }


  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    const personId = +id;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingPerson = await this.personService.findById(personId);
      if (!existingPerson) {
        throw new NotFoundException(`Persona con ID ${personId} no encontrada`);
      }

      // La lógica del servicio ya maneja la eliminación.
      // Se delega la eliminación con el queryRunner
      await queryRunner.manager.delete(Person, personId);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}