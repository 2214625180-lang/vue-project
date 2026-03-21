import {
  Body,
  Controller,
  HttpCode,
  InternalServerErrorException,
  Post,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { ChatStreamDto } from './dto/chat-stream.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('stream')
  @HttpCode(200)
  async streamChat(@Body() body: ChatStreamDto, @Res() res: Response) {
    const abortController = new AbortController();

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const handleClose = () => {
      abortController.abort();
    };

    res.on('close', handleClose);

    try {
      for await (const chunk of this.chatService.streamChat(
        body.messages,
        abortController.signal,
      )) {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Chat stream failed';

      if (!res.writableEnded) {
        res.write(`event: error\ndata: ${JSON.stringify({ message })}\n\n`);
        res.end();
      }

      if (
        !(error instanceof Error && error.name === 'AbortError') &&
        !(error instanceof InternalServerErrorException)
      ) {
        throw error;
      }
    } finally {
      res.off('close', handleClose);
    }
  }
}
