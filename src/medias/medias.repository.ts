import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';

@Injectable()
export class MediasRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateMediaDto) {
    return await this.prisma.media.create({ data });
  }

  async findAll() {
    return await this.prisma.media.findMany();
  }

  async findOne(id: number) {
    return await this.prisma.media.findUnique({ where: { id } });
  }

  async update(id: number, data: UpdateMediaDto) {
    return await this.prisma.media.update({ where: { id }, data });
  }

  async remove(id: number) {
    return await this.prisma.media.delete({ where: { id } });
  }
}
