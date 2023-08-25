import { IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  text: string;

  @IsUrl({ require_protocol: true })
  @IsOptional()
  image?: string;
}
