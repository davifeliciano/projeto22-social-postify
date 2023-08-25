import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePublicationDto } from './dto/create-publication.dto';
import { UpdatePublicationDto } from './dto/update-publication.dto';
import { GetQueryDto } from './dto/get-query.dto';

@Injectable()
export class PublicationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreatePublicationDto) {
    return await this.prisma.publication.create({ data });
  }

  async findAll(query: GetQueryDto) {
    return await this.prisma.publication.findMany({
      where: {
        AND: [
          {
            date: {
              gt: query.after,
            },
          },
          {
            date: {
              lte: query.published ? new Date() : undefined,
              gt: !query.published ? new Date() : undefined,
            },
          },
        ],
      },
    });
  }

  async findOne(id: number) {
    return await this.prisma.publication.findUnique({ where: { id } });
  }

  async update(id: number, data: UpdatePublicationDto) {
    return await this.prisma.publication.update({ where: { id }, data });
  }

  async remove(id: number) {
    return await this.prisma.publication.delete({ where: { id } });
  }
}
