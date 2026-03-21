import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ChatMessageDto } from './dto/chat-message.dto';

const SYSTEM_PROMPT =
  '你是一个专业的电商智能导购。请根据用户的需求推荐合适的商品类别、搭配建议或购物贴士。语气要热情专业，尽量使用 Markdown 列表。';

@Injectable()
export class ChatService {
  private readonly apiKey = process.env.OPENAI_API_KEY;
  private readonly baseUrl =
    process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  private readonly model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  async *streamChat(
    messages: ChatMessageDto[],
    signal?: AbortSignal,
  ): AsyncGenerator<string> {
    if (!this.apiKey) {
      throw new InternalServerErrorException('OPENAI_API_KEY is not configured');
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        stream: true,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.map(({ role, content }) => ({ role, content })),
        ],
      }),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new InternalServerErrorException(
        `LLM request failed: ${response.status} ${errorText}`,
      );
    }

    if (!response.body) {
      throw new InternalServerErrorException('LLM stream is empty');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const segments = buffer.split('\n\n');
        buffer = segments.pop() ?? '';

        for (const segment of segments) {
          const lines = segment
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.startsWith('data:'));

          for (const line of lines) {
            const payload = line.slice(5).trim();

            if (!payload) {
              continue;
            }

            if (payload === '[DONE]') {
              return;
            }

            const parsed = JSON.parse(payload);
            const content: string | undefined =
              parsed?.choices?.[0]?.delta?.content;

            if (content) {
              yield content;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
