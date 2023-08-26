import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { MediasRepository } from './medias.repository';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

function handleConflictError(err: Error) {
  if (err instanceof PrismaClientKnownRequestError && err.code === 'P2002') {
    throw new ConflictException('Media already exists');
  }
}

function handleNotFoundError(err: Error) {
  const errorCodes = ['P2001', 'P2025'];

  if (
    err instanceof PrismaClientKnownRequestError &&
    errorCodes.includes(err.code)
  ) {
    throw new NotFoundException('Media not found');
  }
}

@Injectable()
export class MediasService {
  constructor(private readonly mediasRepository: MediasRepository) {}

  async create(createMediaDto: CreateMediaDto) {
    try {
      return await this.mediasRepository.create(createMediaDto);
    } catch (err) {
      handleConflictError(err);
      throw err;
    }
  }

  async findAll() {
    return await this.mediasRepository.findAll();
  }

  async findOne(id: number) {
    const media = await this.mediasRepository.findOne(id);

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    return media;
  }

  async update(id: number, updateMediaDto: UpdateMediaDto) {
    try {
      return await this.mediasRepository.update(id, updateMediaDto);
    } catch (err) {
      handleConflictError(err);
      handleNotFoundError(err);
      throw err;
    }
  }

  async remove(id: number) {
    try {
      return await this.mediasRepository.remove(id);
    } catch (err) {
      handleNotFoundError(err);
      throw err;
    }
  }
}
