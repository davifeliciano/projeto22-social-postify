import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreatePostDto) {
    return await this.prisma.post.create({ data });
  }

  async findAll() {
    return await this.prisma.post.findMany();
  }

  async findOne(id: number) {
    return await this.prisma.post.findUnique({ where: { id } });
  }

  async update(id: number, data: UpdatePostDto) {
    return await this.prisma.post.update({ where: { id }, data });
  }

  async remove(id: number) {
    return await this.prisma.post.delete({ where: { id } });
  }
}
