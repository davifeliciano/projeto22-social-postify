import { IsNotEmpty } from 'class-validator';

export class CreateMediaDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  username: string;
}
