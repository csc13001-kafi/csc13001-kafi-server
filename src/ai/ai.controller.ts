import {
    Body,
    Controller,
    Post,
    Headers,
    Logger,
    UseGuards,
} from '@nestjs/common';
import { AiService } from './ai.service';
import {
    ApiResponse,
    ApiOperation,
    ApiBody,
    ApiTags,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/roles.enum';
import { ATAuthGuard } from 'src/auth/guards/at-auth.guard';

@Controller('ai')
@ApiTags('AI')
@ApiBearerAuth('access-token')
@UseGuards(ATAuthGuard)
@Roles(Role.MANAGER)
export class AiController {
    private readonly logger = new Logger(AiController.name);

    constructor(private readonly aiService: AiService) {}

    @ApiOperation({ summary: 'Chat with the AI [MANAGER]' })
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

    @ApiOperation({
        summary: 'Create a new chat session on cache [MANAGER]',
    })
    @ApiResponse({ status: 200, description: 'The session ID' })
    @Post('session')
    async newSession() {
        const sessionId = Date.now().toString();
        await this.aiService.createNewSession(sessionId);

        this.logger.debug(`Created new session via REST: ${sessionId}`);

        return {
            sessionId,
        };
    }
}
