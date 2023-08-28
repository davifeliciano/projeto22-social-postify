import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TestPrismaService } from './common/TestPrismaService';
import { PostsFactory } from './factories/posts.factory';

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

  describe('PostsController', () => {
    const basePath = '/posts';
    const postDataWithImage = PostsFactory.build({ includeImage: true });
    const postDataWithoutImage = PostsFactory.build({ includeImage: false });

    it('/    (POST)', async () => {
      const expectedBodyWithImage = {
        ...postDataWithImage,
        id: expect.any(Number),
      };

      const expectedBodyWithoutImage = {
        ...postDataWithoutImage,
        image: null,
        id: expect.any(Number),
      };

      await request(app.getHttpServer())
        .post(basePath)
        .send()
        .expect(HttpStatus.BAD_REQUEST);

      await request(app.getHttpServer())
        .post(basePath)
        .send({ title: postDataWithImage.title })
        .expect(HttpStatus.BAD_REQUEST);

      const responseWithImage = await request(app.getHttpServer())
        .post(basePath)
        .send(postDataWithImage)
        .expect(HttpStatus.CREATED);

      const responseWithoutImage = await request(app.getHttpServer())
        .post(basePath)
        .send(postDataWithoutImage)
        .expect(HttpStatus.CREATED);

      const posts = await prisma.post.findMany();

      expect(responseWithImage.body).toEqual(expectedBodyWithImage);
      expect(responseWithoutImage.body).toEqual(expectedBodyWithoutImage);
      expect(posts).toContainEqual(expectedBodyWithImage);
      expect(posts).toContainEqual(expectedBodyWithoutImage);
    });

    it('/    (GET)', async () => {
      const amount = 10;
      const data = PostsFactory.buildMany(amount, { includeImage: true });
      const expectedBody = data.map((post) => ({
        ...post,
        id: expect.any(Number),
      }));

      await prisma.post.createMany({ data });

      const response = await request(app.getHttpServer())
        .get(basePath)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(expect.arrayContaining(expectedBody));
    });

    it('/:id (GET)', async () => {
      const post = await prisma.post.create({ data: postDataWithImage });

      await request(app.getHttpServer())
        .get(`${basePath}/${post.id + 1}`)
        .expect(HttpStatus.NOT_FOUND);

      const response = await request(app.getHttpServer())
        .get(`${basePath}/${post.id}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(post);
    });

    it('/:id (PATCH)', async () => {
      const post = await prisma.post.create({ data: postDataWithoutImage });
      const newPostData = PostsFactory.build({ includeImage: true });
      const expectedBody = { ...post, ...newPostData };

      await request(app.getHttpServer())
        .patch(`${basePath}/${post.id + 1}`)
        .expect(HttpStatus.NOT_FOUND);

      let response = await request(app.getHttpServer())
        .patch(`${basePath}/${post.id}`)
        .send({})
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(post);

      response = await request(app.getHttpServer())
        .patch(`${basePath}/${post.id}`)
        .send(newPostData)
        .expect(HttpStatus.OK);

      const newPost = await prisma.post.findUnique({
        where: { id: post.id },
      });

      expect(response.body).toEqual(expectedBody);
      expect(newPost).toEqual(expectedBody);
    });

    it('/:id (DELETE)', async () => {
      const createdPost = await prisma.post.create({
        data: postDataWithImage,
      });

      let post = await prisma.post.findUnique({
        where: { id: createdPost.id },
      });

      expect(createdPost).toEqual(post);

      await request(app.getHttpServer())
        .delete(`${basePath}/${createdPost.id + 1}`)
        .expect(HttpStatus.NOT_FOUND);

      const response = await request(app.getHttpServer())
        .delete(`${basePath}/${createdPost.id}`)
        .expect(HttpStatus.OK);

      post = await prisma.post.findUnique({ where: { id: createdPost.id } });

      expect(response.body).toEqual(createdPost);
      expect(post).toBeNull();
    });
  });
});
