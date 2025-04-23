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
    ANALYTICS_PROMPT,
} from './prompts';
import { AnalyticsService } from '../analytics/analytics.service';
import { Role } from '../auth/enums/roles.enum';

@Injectable()
export class AiService implements OnModuleInit {
    private openai: OpenAI;
    private knowledgeBase: string[] = [];
    private readonly logger = new Logger(AiService.name);

    constructor(
        private configService: ConfigService,
        @InjectRedis() private readonly redisClient: Redis,
        private readonly vectorDBAdapter: VectorDBAdapter,
        private readonly analyticsService: AnalyticsService,
    ) {
        this.openai = new OpenAI({
            apiKey: this.configService.get<string>('OPENAI_API_KEY'),
        });
    }

    async onModuleInit() {
        this.logger.log('Initializing AI Service...');
        await this.loadKnowledgeBase();
        await this.vectorDBAdapter.initialize(this.knowledgeBase);
        this.logger.log('AI Service initialized successfully');
    }

    private async loadKnowledgeBase() {
        this.knowledgeBase = [
            // General coffee shop information
            'Giờ mở cửa của Kafi là từ 7:00 đến 22:00 hàng ngày, kể cả các ngày lễ.',
            'Kafi được thành lập vào năm 04/2025',

            // Business strategy
            'Chương trình khách hàng thân thiết của Kafi có 3 cấp độ: Bạc (cần 1000 điểm, giảm 5%), Vàng (cần 2000 điểm, giảm 10%) và Kim cương (cần 5000 điểm, giảm 15%).',
            'Kafi chú trọng vào trải nghiệm trên nền tảng số, với ứng dụng POS và tích điểm cho khách hàng thân thiết',

            // Operations
            'Kafi tự xây dựng hệ thống POS client và xem menu cùng với số điểm tích lũy của chương trình khách hàng thân thiết',
            'Kafi sử dụng hệ thống POS tích hợp để quản lý đơn hàng và kho.',
        ];

        try {
            const firstAnalyticsData = await this.getRealTimeAnalyticsData(
                'products, orders, employees, categories, năm nay',
            );

            if (firstAnalyticsData) {
                const newAnalyticsData = firstAnalyticsData.split('\n');
                for (const data of newAnalyticsData) {
                    if (data.length > 0) {
                        this.knowledgeBase.push(`${data}`);
                    }
                }
            }

            const secondAnalyticsData = await this.getRealTimeAnalyticsData(
                'products, orders, tháng này',
            );

            if (secondAnalyticsData) {
                const newAnalyticsData = secondAnalyticsData.split('\n');
                for (const data of newAnalyticsData) {
                    if (data.length > 0) {
                        this.knowledgeBase.push(`${data}`);
                    }
                }
            }

            const thirdAnalyticsData = await this.getRealTimeAnalyticsData(
                'products, orders, hôm nay',
            );

            if (thirdAnalyticsData) {
                const newAnalyticsData = thirdAnalyticsData.split('\n');
                for (const data of newAnalyticsData) {
                    if (data.length > 0) {
                        this.knowledgeBase.push(`${data}`);
                    }
                }
            }
        } catch (error) {
            this.logger.warn(
                `Failed to add analytics data to knowledge base: ${error.message}`,
            );
        }

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
            const rawRelevantContext = await this.vectorDBAdapter.querySimilar(
                queryEmbedding,
                3,
            );

            console.log('rawRelevantContext', rawRelevantContext);
            // Assess if results are truly relevant to the user query
            const relevantContext = this.assessRelevance(
                message,
                rawRelevantContext,
            );
            console.log('relevantContext', relevantContext);

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
            // const promptTemplate = this.determinePromptTemplate(message);

            //console.log(relevantContext);
            if (
                chatHistory.length > 0 &&
                chatHistory[chatHistory.length - 1].role === 'user'
            ) {
                let contextPrompt = `${message}\n\n`;

                if (relevantContext.length > 0) {
                    contextPrompt += `Thông tin tham khảo:\n${relevantContext.join('\n')}\n`;
                } else {
                    // If no relevant context found, explicitly tell the model
                    contextPrompt += `Không có thông tin tham khảo liên quan đến câu hỏi này.\n`;
                }

                chatHistory[chatHistory.length - 1].content = contextPrompt;
            }

            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: chatHistory,
                temperature: 0.5,
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

            // Limit history length to avoid token limits (keep last 30 messages)
            const historyLength = await this.redisClient.llen(
                `chat:${sessionId}`,
            );
            if (historyLength > 30) {
                await this.redisClient.ltrim(
                    `chat:${sessionId}`,
                    historyLength - 30,
                    -1,
                );
            }

            return responseContent;
        } catch (error) {
            this.logger.error(`Error generating response: ${error.message}`);
            throw new Error('An error occurred while processing your message');
        }
    }

    private async createEmbedding(text: string): Promise<number[]> {
        try {
            const embeddingResponse = await this.openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: text,
                encoding_format: 'float',
            });

            return embeddingResponse.data[0].embedding;
        } catch (error) {
            this.logger.error(`Error creating embedding: ${error.message}`);
            throw new Error('Cannot create embedding');
        }
    }

    private determinePromptTemplate(message: string): string {
        const lowercaseMessage = message.toLowerCase();

        // Analytics prompt detection
        if (
            this.containsDashboardKeywords(lowercaseMessage) ||
            this.containsOrdersKeywords(lowercaseMessage) ||
            this.containsUsersKeywords(lowercaseMessage) ||
            this.containsProductsKeywords(lowercaseMessage) ||
            this.containsCategoriesKeywords(lowercaseMessage)
        ) {
            return ANALYTICS_PROMPT;
        }

        // Business strategy prompt detection
        if (
            lowercaseMessage.includes('chiến lược') ||
            lowercaseMessage.includes('kinh doanh') ||
            lowercaseMessage.includes('doanh thu') ||
            lowercaseMessage.includes('tiếp thị')
        ) {
            return STRATEGY_PROMPT.replace('{timeframe}', '3 tháng tới');
        }

        // Menu optimization prompt detection
        if (
            lowercaseMessage.includes('menu') ||
            lowercaseMessage.includes('món') ||
            lowercaseMessage.includes('đồ uống') ||
            lowercaseMessage.includes('thực đơn')
        ) {
            return MENU_OPTIMIZATION_PROMPT;
        }

        // Customer service prompt detection
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

    private extractTimeRange(message: string): {
        startDate: Date;
        endDate: Date;
    } {
        const lowercaseMessage = message.toLowerCase();
        const now = new Date();
        let startDate = new Date();
        let endDate = new Date(now);

        // Default is last 30 days
        startDate.setDate(startDate.getDate() - 30);

        // Check for time period mentions
        if (
            lowercaseMessage.includes('hôm nay') ||
            lowercaseMessage.includes('ngày hôm nay')
        ) {
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
        } else if (
            lowercaseMessage.includes('hôm qua') ||
            lowercaseMessage.includes('ngày hôm qua')
        ) {
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now);
            endDate.setDate(endDate.getDate() - 1);
            endDate.setHours(23, 59, 59, 999);
        } else if (
            lowercaseMessage.includes('tuần này') ||
            lowercaseMessage.includes('this week')
        ) {
            const day = startDate.getDay() || 7; // Get day of week (0 is Sunday, 6 is Saturday)
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - day + 1); // Set to Monday of current week
            startDate.setHours(0, 0, 0, 0);
        } else if (
            lowercaseMessage.includes('tuần trước') ||
            lowercaseMessage.includes('last week')
        ) {
            const day = now.getDay() || 7;
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - day - 6); // Previous Monday
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now);
            endDate.setDate(endDate.getDate() - day);
            endDate.setHours(23, 59, 59, 999);
        } else if (
            lowercaseMessage.includes('tháng này') ||
            lowercaseMessage.includes('this month')
        ) {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (
            lowercaseMessage.includes('tháng trước') ||
            lowercaseMessage.includes('last month')
        ) {
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        } else if (
            lowercaseMessage.includes('quý này') ||
            lowercaseMessage.includes('this quarter')
        ) {
            const quarter = Math.floor(now.getMonth() / 3);
            startDate = new Date(now.getFullYear(), quarter * 3, 1);
        } else if (
            lowercaseMessage.includes('năm nay') ||
            lowercaseMessage.includes('this year')
        ) {
            startDate = new Date(now.getFullYear(), 0, 1);
        } else if (
            lowercaseMessage.includes('năm ngoái') ||
            lowercaseMessage.includes('last year')
        ) {
            startDate = new Date(now.getFullYear() - 1, 0, 1);
            endDate = new Date(now.getFullYear() - 1, 11, 31);
        }

        return { startDate, endDate };
    }

    private async getRealTimeAnalyticsData(
        message: string,
    ): Promise<string | null> {
        const { startDate, endDate } = this.extractTimeRange(message);
        // Get analytics data for the report
        const dashboardStats = await this.analyticsService.getDashboardStats(
            startDate,
            endDate,
        );
        const reportData = {
            ordersCount: dashboardStats.Overview.ordersCount || 0,
            ordersTotalPrice: dashboardStats.Overview.ordersTotalPrice || 0,
            categoriesCount: dashboardStats.Product.categoriesCount || 0,
            productsCount: dashboardStats.Product.productsCount || 0,
        };
        const lowercaseMessage = message.toLowerCase();

        try {
            // Extract time range from the message
            const { startDate, endDate } = this.extractTimeRange(message);

            // Format dates for display
            const startDateFormatted = startDate.toLocaleDateString('vi-VN');
            const endDateFormatted = endDate.toLocaleDateString('vi-VN');
            const timeRangeText = `từ ${startDateFormatted} đến ${endDateFormatted}`;

            // Check if query is about analytics data
            const isOrdersQuery = this.containsOrdersKeywords(lowercaseMessage);
            const isUsersQuery = this.containsUsersKeywords(lowercaseMessage);
            const isProductsQuery =
                this.containsProductsKeywords(lowercaseMessage);
            const isCategoriesQuery =
                this.containsCategoriesKeywords(lowercaseMessage);

            // If not asking about analytics data, return null
            if (
                !isOrdersQuery &&
                !isUsersQuery &&
                !isProductsQuery &&
                !isCategoriesQuery
            ) {
                return null;
            }

            // Get relevant real-time data
            let analyticsData = '';
            // Get orders data if requested
            if (isOrdersQuery) {
                const ordersCount =
                    await this.analyticsService.getOrdersCountByTimeRange(
                        startDate,
                        endDate,
                    );
                analyticsData += `Số lượng đơn hàng ${timeRangeText}: ${ordersCount}\n`;
            }

            // Get users data if requested
            if (isUsersQuery) {
                const employeesCount =
                    await this.analyticsService.getUsersCountByRole(
                        Role.EMPLOYEE,
                    );
                const managersCount =
                    await this.analyticsService.getUsersCountByRole(
                        Role.MANAGER,
                    );
                analyticsData += `Số lượng nhân viên: ${employeesCount}\n`;
                analyticsData += `Số lượng quản lý: ${managersCount}\n`;
                analyticsData += `Tổng số nhân sự: ${employeesCount + managersCount}\n`;
            }

            // Get products data if requested
            if (isProductsQuery) {
                const productsCount =
                    await this.analyticsService.getProductsCount();
                analyticsData += `Số lượng sản phẩm: ${productsCount}\n`;
                const products = await this.analyticsService.getProducts();
                let productList = '';
                for (const product of products) {
                    productList += `Sản phẩm: ${product.name}: ${product.price}, `;
                }
                analyticsData += `Danh sách sản phẩm: ${productList}\n`;
            }

            // Get categories data if requested
            if (isCategoriesQuery) {
                const categoriesCount =
                    await this.analyticsService.getCategoriesCount();
                analyticsData += `Số lượng danh mục: ${timeRangeText}: ${categoriesCount}\n`;
            }
            analyticsData += `Tổng doanh thu: ${reportData.ordersTotalPrice}\n`;

            return analyticsData || null;
        } catch (error) {
            this.logger.error(`Error getting analytics data: ${error.message}`);
            return null;
        }
    }

    private containsOrdersKeywords(message: string): boolean {
        return (
            message.includes('đơn hàng') ||
            message.includes('order') ||
            message.includes('đơn') ||
            message.includes('bán hàng') ||
            message.includes('doanh số') ||
            message.includes('sales')
        );
    }

    private containsUsersKeywords(message: string): boolean {
        return (
            message.includes('nhân viên') ||
            message.includes('employee') ||
            message.includes('quản lý') ||
            message.includes('manager') ||
            message.includes('user') ||
            message.includes('người dùng') ||
            message.includes('nhân sự') ||
            message.includes('personnel')
        );
    }

    private containsProductsKeywords(message: string): boolean {
        return (
            message.includes('sản phẩm') ||
            message.includes('product') ||
            message.includes('mặt hàng') ||
            message.includes('món') ||
            message.includes('đồ uống') ||
            message.includes('beverage')
        );
    }

    private containsCategoriesKeywords(message: string): boolean {
        return (
            message.includes('danh mục') ||
            message.includes('category') ||
            message.includes('categories') ||
            message.includes('loại')
        );
    }

    private containsDashboardKeywords(message: string): boolean {
        return (
            message.includes('dashboard') ||
            message.includes('thống kê') ||
            message.includes('analytics') ||
            message.includes('tổng quan') ||
            message.includes('báo cáo') ||
            message.includes('report')
        );
    }

    private assessRelevance(
        userQuery: string,
        searchResults: string[],
    ): string[] {
        // If there are no results, return empty array
        if (
            !searchResults ||
            searchResults.length === 0 ||
            searchResults[0] === 'There is no data to reference.' ||
            searchResults[0] === 'There is no relevant data to reference.'
        ) {
            return [];
        }

        try {
            // Use a simple heuristic to filter out irrelevant results
            // For each result, check if it contains at least one of the key terms from the query
            const keyTerms = userQuery
                .toLowerCase()
                .split(/\s+/)
                .filter((word) => word.length > 2) // Only consider words longer than 2 characters
                .map((word) => word.replace(/[.,?!;:]/g, '')); // Remove punctuation

            // If no key terms (after filtering), return the results as is
            if (keyTerms.length === 0) {
                return searchResults;
            }

            // Filter results that contain at least one key term
            const filteredResults = searchResults.filter((result) => {
                const resultLower = result.toLowerCase();
                // Check if any key term is present in the result
                return keyTerms.some((term) => resultLower.includes(term));
            });

            if (filteredResults.length === 0) {
                return [];
            }

            return filteredResults;
        } catch (error) {
            this.logger.error(`Error assessing relevance: ${error.message}`);
            return searchResults; // Return original results if assessment fails
        }
    }
}
