import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { VectorDBAdapter } from './vector-db.adapter';
import {
    SYSTEM_PROMPT,
    STRATEGY_PROMPT,
    MENU_OPTIMIZATION_PROMPT,
    CUSTOMER_SERVICE_PROMPT,
} from './prompts';

@Injectable()
export class AiService implements OnModuleInit {
    private openai: OpenAI;
    private knowledgeBase: string[] = [];
    private readonly logger = new Logger(AiService.name);

    constructor(
        private configService: ConfigService,
        @InjectRedis() private readonly redisClient: Redis,
        private readonly vectorDBAdapter: VectorDBAdapter,
    ) {
        this.openai = new OpenAI({
            apiKey: this.configService.get<string>('OPENAI_API_KEY'),
        });
    }

    async onModuleInit() {
        this.logger.log('Initializing AI Service...');
        this.loadKnowledgeBase();
        await this.vectorDBAdapter.initialize(this.knowledgeBase);
        this.logger.log('AI Service initialized successfully');
    }

    private loadKnowledgeBase() {
        this.knowledgeBase = [
            // General coffee shop information
            'Quán cà phê Kafi chuyên về các loại cà phê đặc sản và thức uống sáng tạo.',
            'Menu của Kafi bao gồm cà phê Việt Nam truyền thống và các biến thể hiện đại.',
            'Giờ mở cửa của Kafi là từ 7:00 đến 22:00 hàng ngày, kể cả các ngày lễ.',
            'Kafi có 3 chi nhánh ở Thành phố Hồ Chí Minh, nằm ở Quận 1, Quận 3 và Quận 7.',
            'Kafi được thành lập vào năm 2020 và nhanh chóng trở thành điểm đến yêu thích của giới trẻ.',

            // Products and menu
            'Cà phê sữa đá là sản phẩm bán chạy nhất của Kafi, chiếm 30% doanh số.',
            'Kafi sử dụng hạt cà phê Arabica từ Đà Lạt và Robusta từ Buôn Ma Thuột.',
            'Các sản phẩm nổi bật khác bao gồm: Bạc xỉu, Cà phê trứng, Cà phê dừa, và Cold Brew.',
            'Ngoài cà phê, Kafi còn phục vụ trà, nước ép trái cây tươi và các món bánh nhẹ.',
            'Giá sản phẩm dao động từ 25.000đ đến 85.000đ, phù hợp với nhiều đối tượng khách hàng.',

            // Business strategy
            'Kafi áp dụng chiến lược khác biệt hóa thông qua không gian thiết kế và trải nghiệm khách hàng.',
            'Chương trình khách hàng thân thiết của Kafi có 3 cấp độ: Bạc, Vàng và Kim cương.',
            'Kafi chú trọng vào trải nghiệm trên nền tảng số, với ứng dụng đặt hàng và tích điểm.',
            'Chiến lược marketing chính của Kafi là mạng xã hội và influencer marketing.',
            'Kafi hợp tác với các doanh nghiệp lân cận để tạo ra các gói combo và ưu đãi chéo.',

            // Customer insights
            'Khách hàng mục tiêu của Kafi chủ yếu là sinh viên và nhân viên văn phòng từ 18-35 tuổi.',
            'Khung giờ cao điểm của Kafi là 7:30-9:00 và 17:00-19:00 các ngày trong tuần.',
            'Cuối tuần thường có lượng khách tăng 40% so với ngày thường.',
            'Khách hàng thường ở lại quán trung bình 45-60 phút mỗi lần ghé thăm.',
            'Theo khảo sát, 70% khách hàng chọn Kafi vì chất lượng đồ uống, 20% vì không gian.',

            // Operations
            'Kafi sử dụng hệ thống POS tích hợp để quản lý đơn hàng và kho.',
            'Mỗi chi nhánh có 5-7 nhân viên, bao gồm quản lý, pha chế và phục vụ.',
            'Kafi mua nguyên liệu chính từ các nhà cung cấp địa phương để đảm bảo độ tươi ngon.',
            'Chi phí vận hành chính bao gồm: nhân công (40%), nguyên liệu (30%), thuê mặt bằng (20%).',
            'Kafi áp dụng các biện pháp bền vững như sử dụng ống hút giấy và bao bì có thể tái chế.',
        ];

        this.logger.log(`Loaded ${this.knowledgeBase.length} knowledge items`);
    }

    async createNewSession(sessionId: string): Promise<void> {
        await this.redisClient.del(`chat:${sessionId}`);

        const systemMessage = {
            role: 'system',
            content: SYSTEM_PROMPT,
        };

        await this.redisClient.rpush(
            `chat:${sessionId}`,
            JSON.stringify(systemMessage),
        );
        this.logger.debug(`Created new session: ${sessionId}`);
    }

    async generateResponse(
        message: string,
        sessionId: string,
    ): Promise<string> {
        try {
            // Get chat history or create new session if doesn't exist
            const chatHistoryExists = await this.redisClient.exists(
                `chat:${sessionId}`,
            );

            if (!chatHistoryExists) {
                await this.createNewSession(sessionId);
            }

            // Get relevant knowledge from RAG
            const queryEmbedding = await this.createEmbedding(message);
            const relevantContext = this.vectorDBAdapter.querySimilar(
                queryEmbedding,
                3,
            );

            // Add user message to history
            const userMessage = {
                role: 'user',
                content: message,
            };
            await this.redisClient.rpush(
                `chat:${sessionId}`,
                JSON.stringify(userMessage),
            );

            // Get chat history
            const chatHistoryRaw = await this.redisClient.lrange(
                `chat:${sessionId}`,
                0,
                -1,
            );
            const chatHistory = chatHistoryRaw.map((msg) => JSON.parse(msg));

            // Process the message to identify intent and apply appropriate prompt template
            const promptTemplate = this.determinePromptTemplate(message);

            // Add RAG context and prompt template to the latest user message
            if (
                chatHistory.length > 0 &&
                chatHistory[chatHistory.length - 1].role === 'user'
            ) {
                chatHistory[chatHistory.length - 1].content = `
                    ${message}

                    ${promptTemplate}

                    Thông tin tham khảo:
                    ${(await relevantContext).join('\n')}
                            `;
            }

            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: chatHistory,
                temperature: 0.7,
            });

            const responseContent = completion.choices[0].message.content;

            const assistantMessage = {
                role: 'assistant',
                content: responseContent,
            };
            await this.redisClient.rpush(
                `chat:${sessionId}`,
                JSON.stringify(assistantMessage),
            );

            // Limit history length to avoid token limits (keep last 20 messages)
            const historyLength = await this.redisClient.llen(
                `chat:${sessionId}`,
            );
            if (historyLength > 20) {
                await this.redisClient.ltrim(
                    `chat:${sessionId}`,
                    historyLength - 20,
                    -1,
                );
            }

            return responseContent;
        } catch (error) {
            this.logger.error(`Error generating response: ${error.message}`);
            throw new Error('Đã xảy ra lỗi khi xử lý tin nhắn của bạn');
        }
    }

    private async createEmbedding(text: string): Promise<number[]> {
        try {
            const embeddingResponse = await this.openai.embeddings.create({
                model: 'text-embedding-ada-002',
                input: text,
                encoding_format: 'float',
            });

            return embeddingResponse.data[0].embedding;
        } catch (error) {
            this.logger.error(`Error creating embedding: ${error.message}`);
            throw new Error('Không thể tạo embedding');
        }
    }

    private determinePromptTemplate(message: string): string {
        const lowercaseMessage = message.toLowerCase();

        // Simple keyword-based intent detection
        if (
            lowercaseMessage.includes('chiến lược') ||
            lowercaseMessage.includes('kinh doanh') ||
            lowercaseMessage.includes('doanh thu') ||
            lowercaseMessage.includes('tiếp thị')
        ) {
            return STRATEGY_PROMPT.replace('{timeframe}', '3 tháng tới');
        }

        if (
            lowercaseMessage.includes('menu') ||
            lowercaseMessage.includes('món') ||
            lowercaseMessage.includes('đồ uống') ||
            lowercaseMessage.includes('thực đơn')
        ) {
            return MENU_OPTIMIZATION_PROMPT;
        }

        if (
            lowercaseMessage.includes('khách hàng') ||
            lowercaseMessage.includes('phản hồi') ||
            lowercaseMessage.includes('dịch vụ') ||
            lowercaseMessage.includes('chăm sóc')
        ) {
            return CUSTOMER_SERVICE_PROMPT;
        }

        // Default to system prompt if no specific intent detected
        return '';
    }
}
