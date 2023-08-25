import { Transform } from 'class-transformer';
import { IsBoolean, IsDate, IsOptional } from 'class-validator';

function booleanTransformer(value: string | undefined) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

function dateTransformer(value: string | undefined) {
  const parsedTimestamp = Date.parse(value);

  if (Number.isNaN(parsedTimestamp)) {
    return value;
  }

  return new Date(parsedTimestamp);
}

export class GetQueryDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => booleanTransformer(value))
  published?: boolean;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => dateTransformer(value))
  after?: Date;
}
