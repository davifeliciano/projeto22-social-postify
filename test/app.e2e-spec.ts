import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TestPrismaService } from './common/TestPrismaService';

describe('Integration Tests (e2e)', () => {
  let app: INestApplication;
  const prisma = new TestPrismaService();

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, PrismaModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));

    await prisma.clearDatabase();
    await app.init();
  });

  describe('AppController', () => {
    it('/    (GET)', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(HttpStatus.OK)
        .expect("I'm ok!");
    });
  });
});
