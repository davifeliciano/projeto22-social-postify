import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TestPrismaService } from './common/TestPrismaService';
import { MediasFactory } from './factories/medias.factory';
import { PostsFactory } from './factories/posts.factory';
import { PublicationsFactory } from './factories/publications.factory';
import { faker } from '@faker-js/faker';

function addDaysToDate(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getFormattedDate(date: Date) {
  return date.toISOString().split('T').at(0);
}

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

  const setupBaseScenario = async () => {
    const [media, post] = await prisma.$transaction([
      prisma.media.create({ data: MediasFactory.build() }),
      prisma.post.create({ data: PostsFactory.build({ includeImage: true }) }),
    ]);

    const publicationData = PublicationsFactory.build(
      media.id,
      post.id,
      faker.date.soon(),
    );

    return { media, post, publicationData };
  };

  describe('PublicationsController', () => {
    const basePath = '/publications';

    it('/    (POST)', async () => {
      const { media, post, publicationData } = await setupBaseScenario();
      const expectedBody = {
        ...publicationData,
        id: expect.any(Number),
      };

      await request(app.getHttpServer())
        .post(basePath)
        .send()
        .expect(HttpStatus.BAD_REQUEST);

      await request(app.getHttpServer())
        .post(basePath)
        .send({ date: new Date().toISOString() })
        .expect(HttpStatus.BAD_REQUEST);

      await request(app.getHttpServer())
        .post(basePath)
        .send({ ...publicationData, mediaId: media.id + 1 })
        .expect(HttpStatus.NOT_FOUND);

      await request(app.getHttpServer())
        .post(basePath)
        .send({ ...publicationData, postId: post.id + 1 })
        .expect(HttpStatus.NOT_FOUND);

      const response = await request(app.getHttpServer())
        .post(basePath)
        .send(publicationData)
        .expect(HttpStatus.CREATED);

      const publications = await prisma.publication.findMany();

      expect(publications).toContainEqual(expectedBody);
      expect(response.body).toEqual({
        ...expectedBody,
        date: expectedBody.date.toISOString(),
      });
    });

    it('/    (GET)', async () => {
      const { media, post } = await setupBaseScenario();
      const now = new Date();
      const aWeekFromNow = addDaysToDate(now, 7);
      const aMonthFromNow = addDaysToDate(now, 30);
      const dates = [
        faker.date.recent(),
        faker.date.soon(),
        aWeekFromNow,
        aMonthFromNow,
      ];

      const data = PublicationsFactory.buildMany(media.id, post.id, dates);

      await prisma.publication.createMany({ data });

      const expectedBodyMapper = (publication) => ({
        ...publication,
        id: expect.any(Number),
        date: publication.date.toISOString(),
      });

      let expectedBody = data.map(expectedBodyMapper);
      let response = await request(app.getHttpServer())
        .get(basePath)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(expect.arrayContaining(expectedBody));

      expectedBody = data.slice(0, 1).map(expectedBodyMapper);
      response = await request(app.getHttpServer())
        .get(`${basePath}?published=true`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(expect.arrayContaining(expectedBody));

      expectedBody = data.slice(1).map(expectedBodyMapper);
      response = await request(app.getHttpServer())
        .get(`${basePath}?published=false`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(expect.arrayContaining(expectedBody));

      expectedBody = data.slice(-1).map(expectedBodyMapper);
      response = await request(app.getHttpServer())
        .get(`${basePath}?after=${getFormattedDate(aWeekFromNow)}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(expect.arrayContaining(expectedBody));

      expectedBody = data.slice(1).map(expectedBodyMapper);
      response = await request(app.getHttpServer())
        .get(`${basePath}?after=${getFormattedDate(now)}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(expect.arrayContaining(expectedBody));
    });

    it('/:id (GET)', async () => {
      const { publicationData } = await setupBaseScenario();
      const publication = await prisma.publication.create({
        data: publicationData,
      });

      await request(app.getHttpServer())
        .get(`${basePath}/${publication.id + 1}`)
        .expect(HttpStatus.NOT_FOUND);

      const response = await request(app.getHttpServer())
        .get(`${basePath}/${publication.id}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        ...publication,
        date: publication.date.toISOString(),
      });
    });

    it('/:id (PATCH)', async () => {
      const { media, post, publicationData } = await setupBaseScenario();
      const publication = await prisma.publication.create({
        data: publicationData,
      });

      const newPublicationData = PublicationsFactory.build(media.id, post.id);
      const expectedBody = {
        ...publication,
        ...newPublicationData,
      };

      await request(app.getHttpServer())
        .patch(`${basePath}/${publication.id + 1}`)
        .expect(HttpStatus.NOT_FOUND);

      await request(app.getHttpServer())
        .patch(`${basePath}/${publication.id}`)
        .send({ ...newPublicationData, mediaId: media.id + 1 })
        .expect(HttpStatus.NOT_FOUND);

      await request(app.getHttpServer())
        .patch(`${basePath}/${publication.id}`)
        .send({ ...newPublicationData, postId: post.id + 1 })
        .expect(HttpStatus.NOT_FOUND);

      let response = await request(app.getHttpServer())
        .patch(`${basePath}/${publication.id}`)
        .send({})
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        ...publication,
        date: publication.date.toISOString(),
      });

      response = await request(app.getHttpServer())
        .patch(`${basePath}/${publication.id}`)
        .send(newPublicationData)
        .expect(HttpStatus.OK);

      const newPublication = await prisma.publication.findUnique({
        where: { id: publication.id },
      });

      expect(newPublication).toEqual(expectedBody);
      expect(response.body).toEqual({
        ...expectedBody,
        date: expectedBody.date.toISOString(),
      });
    });

    it('/:id (DELETE)', async () => {
      const { publicationData } = await setupBaseScenario();
      const createdPublication = await prisma.publication.create({
        data: publicationData,
      });

      await request(app.getHttpServer())
        .delete(`${basePath}/${createdPublication.id + 1}`)
        .expect(HttpStatus.NOT_FOUND);

      const response = await request(app.getHttpServer())
        .delete(`${basePath}/${createdPublication.id}`)
        .expect(HttpStatus.OK);

      const publication = await prisma.media.findUnique({
        where: { id: createdPublication.id },
      });

      expect(publication).toBeNull();
      expect(response.body).toEqual({
        ...createdPublication,
        date: createdPublication.date.toISOString(),
      });
    });
  });
});
