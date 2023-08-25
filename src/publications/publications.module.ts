import { Module } from '@nestjs/common';
import { PublicationsService } from './publications.service';
import { PublicationsController } from './publications.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PublicationsRepository } from './publications.repository';

@Module({
  controllers: [PublicationsController],
  providers: [PublicationsService, PublicationsRepository],
  imports: [PrismaModule],
})
export class PublicationsModule {}
