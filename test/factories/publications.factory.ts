import { faker } from '@faker-js/faker';
import { Publication } from '@prisma/client';

export class PublicationsFactory {
  static build(
    mediaId: number,
    postId: number,
    date: Date = faker.date.soon(),
  ): Omit<Publication, 'id'> {
    return { mediaId, postId, date };
  }

  static buildMany(
    mediaId: number,
    postId: number,
    dates: Date[],
  ): Array<Omit<Publication, 'id'>> {
    return dates.map((date) => ({ mediaId, postId, date }));
  }
}
