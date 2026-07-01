import { IsString } from 'class-validator';

export class CreateProjectNoteDto {
  @IsString()
  body: string;
}
