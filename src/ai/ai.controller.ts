import { Body, Controller, Post, Headers, Logger } from '@nestjs/common';
import { AiService } from './ai.service';
import { ApiResponse, ApiOperation, ApiBody } from '@nestjs/swagger';

@Controller('ai')
export class AiController {
    private readonly logger = new Logger(AiController.name);

    constructor(private readonly aiService: AiService) {}

    @ApiOperation({ summary: 'Chat with the AI' })
    @ApiResponse({ status: 200, description: 'The AI response' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string' },
            },
        },
    })
    @Post('chat')
    async chat(
        @Body('message') message: string,
        @Headers('session-id') sessionId: string,
    ) {
        this.logger.debug(`Received message via REST: ${message}`);

        if (!sessionId) {
            sessionId = Date.now().toString();
            await this.aiService.createNewSession(sessionId);
        }

        const response = await this.aiService.generateResponse(
            message,
            sessionId,
        );

        return {
            message: response,
            sessionId,
        };
    }

    @Post('new-session')
    async newSession() {
        const sessionId = Date.now().toString();
        await this.aiService.createNewSession(sessionId);

        this.logger.debug(`Created new session via REST: ${sessionId}`);

        return {
            sessionId,
        };
    }
}
