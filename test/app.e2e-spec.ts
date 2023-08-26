import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TestPrismaService } from './common/TestPrismaService';
import { MediasFactory } from './factories/medias.factory';

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

  describe('MediasController', () => {
    const basePath = '/medias';
    const mediaData = MediasFactory.build();

    it('/    (POST)', async () => {
      const expectedBody = { ...mediaData, id: expect.any(Number) };

      await request(app.getHttpServer())
        .post(basePath)
        .send()
        .expect(HttpStatus.BAD_REQUEST);

      await request(app.getHttpServer())
        .post(basePath)
        .send({ title: mediaData.title })
        .expect(HttpStatus.BAD_REQUEST);

      const response = await request(app.getHttpServer())
        .post(basePath)
        .send(mediaData)
        .expect(HttpStatus.CREATED);

      await request(app.getHttpServer())
        .post(basePath)
        .send(mediaData)
        .expect(HttpStatus.CONFLICT);

      const medias = await prisma.media.findMany();

      expect(response.body).toEqual(expectedBody);
      expect(medias).toContainEqual(expectedBody);
    });

    it('/    (GET)', async () => {
      const amount = 10;
      const data = MediasFactory.buildMany(amount);
      const expectedBody = data.map((media) => ({
        ...media,
        id: expect.any(Number),
      }));

      await prisma.media.createMany({ data });

      const response = await request(app.getHttpServer())
        .get(basePath)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(expect.arrayContaining(expectedBody));
    });

    it('/:id (GET)', async () => {
      const media = await prisma.media.create({ data: mediaData });

      await request(app.getHttpServer())
        .get(`${basePath}/${media.id + 1}`)
        .expect(HttpStatus.NOT_FOUND);

      const response = await request(app.getHttpServer())
        .get(`${basePath}/${media.id}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(media);
    });

    it('/:id (PATCH)', async () => {
      const media = await prisma.media.create({ data: mediaData });
      const newMediaData = MediasFactory.build();
      const expectedBody = { ...media, ...newMediaData };

      await request(app.getHttpServer())
        .patch(`${basePath}/${media.id + 1}`)
        .expect(HttpStatus.NOT_FOUND);

      let response = await request(app.getHttpServer())
        .patch(`${basePath}/${media.id}`)
        .send({})
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(media);

      response = await request(app.getHttpServer())
        .patch(`${basePath}/${media.id}`)
        .send(newMediaData)
        .expect(HttpStatus.OK);

      const newMedia = await prisma.media.findUnique({
        where: { id: media.id },
      });

      expect(response.body).toEqual(expectedBody);
      expect(newMedia).toEqual(expectedBody);
    });

    it('/:id (DELETE)', async () => {
      const createdMedia = await prisma.media.create({ data: mediaData });
      let media = await prisma.media.findUnique({
        where: { id: createdMedia.id },
      });

      expect(createdMedia).toEqual(media);

      await request(app.getHttpServer())
        .delete(`${basePath}/${createdMedia.id + 1}`)
        .expect(HttpStatus.NOT_FOUND);

      const response = await request(app.getHttpServer())
        .delete(`${basePath}/${createdMedia.id}`)
        .expect(HttpStatus.OK);

      media = await prisma.media.findUnique({ where: { id: createdMedia.id } });

      expect(response.body).toEqual(createdMedia);
      expect(media).toBeNull();
    });
  });
});
