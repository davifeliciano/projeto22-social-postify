import { Module } from '@nestjs/common';
import { MediasService } from './medias.service';
import { MediasController } from './medias.controller';
import { MediasRepository } from './medias.repository';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [MediasController],
  providers: [MediasService, MediasRepository],
  imports: [PrismaModule],
})
export class MediasModule {}
