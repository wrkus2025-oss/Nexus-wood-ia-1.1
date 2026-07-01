import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async ask(userId: string, prompt: string) {
    const openAiKey = this.configService.get<string>('OPENAI_API_KEY');
    const ollamaUrl = this.configService.get<string>('OLLAMA_URL');

    let responseText = '';

    if (openAiKey) {
      const model = this.configService.get<string>(
        'OPENAI_MODEL',
        'gpt-4o-mini',
      );
      const authHeader = ['Bearer', openAiKey].join(' ');
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content:
                  'Você é o assistente Nexus Master para marcenaria profissional.',
              },
              { role: 'user', content: prompt },
            ],
          }),
        },
      );

      if (!response.ok) {
        throw new BadRequestException('OpenAI request failed');
      }

      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      responseText = payload.choices?.[0]?.message?.content ?? '';
    } else if (ollamaUrl) {
      const response = await fetch(`${ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.configService.get<string>('OLLAMA_MODEL', 'llama3.1'),
          stream: false,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) {
        throw new BadRequestException('Ollama request failed');
      }

      const payload = (await response.json()) as {
        message?: { content?: string };
      };
      responseText = payload.message?.content ?? '';
    } else {
      throw new BadRequestException(
        'Configure OPENAI_API_KEY or OLLAMA_URL to use AI assistant',
      );
    }

    await this.prisma.aiHistory.create({
      data: { userId, prompt, response: responseText },
    });

    return { response: responseText };
  }

  history(userId: string) {
    return this.prisma.aiHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
