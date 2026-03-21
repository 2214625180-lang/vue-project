import { IsIn, IsOptional, IsString } from 'class-validator';

export class ChatMessageDto {
  @IsIn(['system', 'user', 'assistant'])
  role: 'system' | 'user' | 'assistant';

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  id?: string;
}
