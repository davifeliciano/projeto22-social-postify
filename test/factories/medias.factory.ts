import { faker } from '@faker-js/faker';
import { Media } from '@prisma/client';

export class MediasFactory {
  static build(): Omit<Media, 'id'> {
    return { title: faker.lorem.word(), username: faker.internet.userName() };
  }

  static buildMany(amount: number) {
    return Array(amount).map(() => MediasFactory.build());
  }
}
