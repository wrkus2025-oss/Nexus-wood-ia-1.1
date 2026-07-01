import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiPromptDto } from './dto/ai-prompt.dto';
import { AiService } from './ai.service';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('assist')
  assist(@Req() req: { user: { userId: string } }, @Body() dto: AiPromptDto) {
    return this.aiService.ask(req.user.userId, dto.prompt);
  }

  @Get('history')
  history(@Req() req: { user: { userId: string } }) {
    return this.aiService.history(req.user.userId);
  }
}
