import { IsISO8601, IsInt, IsPositive } from 'class-validator';

export class CreatePublicationDto {
  @IsInt()
  @IsPositive()
  mediaId: number;

  @IsInt()
  @IsPositive()
  postId: number;

  @IsISO8601({ strict: true })
  date: string;
}
