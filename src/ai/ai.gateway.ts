import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AiService } from './ai.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: 'ai',
})
export class AiGateway {
    private readonly logger = new Logger(AiGateway.name);

    @WebSocketServer()
    server: Server;

    constructor(private readonly aiService: AiService) {}

    afterInit() {
        this.logger.log('AI WebSocket Gateway initialized');
    }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('sendMessage')
    async handleMessage(
        @MessageBody() message: string,
        @ConnectedSocket() client: Socket,
    ) {
        this.logger.debug(`Received message from ${client.id}: ${message}`);

        try {
            const sessionId = client.id;
            const response = await this.aiService.generateResponse(
                message,
                sessionId,
            );

            return { event: 'messageResponse', data: response };
        } catch (error) {
            this.logger.error(`Error processing message: ${error.message}`);
            return {
                event: 'error',
                data: 'Error while processing message, please try again later.',
            };
        }
    }

    @SubscribeMessage('startNewChat')
    async handleNewChat(@ConnectedSocket() client: Socket) {
        this.logger.debug(`Starting new chat for client: ${client.id}`);

        try {
            await this.aiService.createNewSession(client.id);
            return { event: 'chatStarted', data: { sessionId: client.id } };
        } catch (error) {
            this.logger.error(`Error starting new chat: ${error.message}`);
            return {
                event: 'error',
                data: 'Error while starting new chat, please try again later.',
            };
        }
    }
}
