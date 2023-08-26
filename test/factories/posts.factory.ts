import { faker } from '@faker-js/faker';

type PostsFactoryOptions = {
  includeImage?: boolean;
};

export class PostsFactory {
  static build(options: PostsFactoryOptions) {
    const basePost = {
      title: faker.lorem.word(),
      text: faker.lorem.paragraph(),
    };

    return options.includeImage
      ? { ...basePost, image: faker.image.url() }
      : basePost;
  }

  static buildMany(amount: number, options: PostsFactoryOptions) {
    return Array(amount).map(() => PostsFactory.build(options));
  }
}
