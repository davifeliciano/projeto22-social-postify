import { OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export class TestPrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async clearDatabase() {
    const tablenames = await this.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    const tables = tablenames
      .map(({ tablename }) => tablename)
      .filter((name) => name !== '_prisma_migrations')
      .map((name) => `"public"."${name}"`)
      .join(', ');

    await this.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  }
}
