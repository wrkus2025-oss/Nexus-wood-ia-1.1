import { IsString, MinLength } from 'class-validator';

export class AiPromptDto {
  @IsString()
  @MinLength(5)
  prompt: string;
}
