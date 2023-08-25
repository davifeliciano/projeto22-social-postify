import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePublicationDto } from './dto/create-publication.dto';
import { UpdatePublicationDto } from './dto/update-publication.dto';
import { PublicationsRepository } from './publications.repository';
import { GetQueryDto } from './dto/get-query.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

function handleNotFoundError(err: Error) {
  if (err instanceof PrismaClientKnownRequestError && err.code === 'P2001') {
    throw new NotFoundException('Page not found');
  }
}

@Injectable()
export class PublicationsService {
  constructor(
    private readonly publicationsRepository: PublicationsRepository,
  ) {}

  async create(createPublicationDto: CreatePublicationDto) {
    return await this.publicationsRepository.create(createPublicationDto);
  }

  async findAll(query: GetQueryDto) {
    return await this.publicationsRepository.findAll(query);
  }

  async findOne(id: number) {
    const publication = await this.publicationsRepository.findOne(id);

    if (!publication) {
      throw new NotFoundException('Publication not found');
    }

    return publication;
  }

  async update(id: number, updatePublicationDto: UpdatePublicationDto) {
    try {
      return await this.publicationsRepository.update(id, updatePublicationDto);
    } catch (err) {
      handleNotFoundError(err);
      throw err;
    }
  }

  async remove(id: number) {
    try {
      return await this.publicationsRepository.remove(id);
    } catch (err) {
      handleNotFoundError(err);
      throw err;
    }
  }
}
