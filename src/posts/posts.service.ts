import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsRepository } from './posts.repository';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

function handleNotFoundError(err: Error) {
  const errorCodes = ['P2001', 'P2025'];

  if (
    err instanceof PrismaClientKnownRequestError &&
    errorCodes.includes(err.code)
  ) {
    throw new NotFoundException('Page not found');
  }
}

@Injectable()
export class PostsService {
  constructor(private readonly postsRepository: PostsRepository) {}

  async create(createPostDto: CreatePostDto) {
    return await this.postsRepository.create(createPostDto);
  }

  async findAll() {
    return await this.postsRepository.findAll();
  }

  async findOne(id: number) {
    const post = await this.postsRepository.findOne(id);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async update(id: number, updatePostDto: UpdatePostDto) {
    try {
      return await this.postsRepository.update(id, updatePostDto);
    } catch (err) {
      handleNotFoundError(err);
      throw err;
    }
  }

  async remove(id: number) {
    try {
      return await this.postsRepository.remove(id);
    } catch (err) {
      handleNotFoundError(err);
      throw err;
    }
  }
}
