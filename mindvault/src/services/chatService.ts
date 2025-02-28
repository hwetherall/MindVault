import { RateLimiter } from 'limiter';

interface ChatError extends Error {
    status?: number;
    retryAfter?: number;
}

interface BatchedRequest {
    questions: string[];
    files: any[];
}

interface BatchedResponse {
    answers: string[];
}

class ChatService {
    private limiter: RateLimiter;
    private readonly MAX_TOKENS_PER_REQUEST = 4000;
    private readonly MAX_RETRIES = 3;
    private readonly INITIAL_BACKOFF = 2000; // 2 seconds
    private requestQueue: Promise<any> = Promise.resolve();
    private cache: Map<string, string> = new Map();

    constructor() {
        // Create a more conservative rate limiter: 1 request per 2 seconds
        this.limiter = new RateLimiter({
            tokensPerInterval: 1,
            interval: 2000
        });
    }

    private getCacheKey(prompt: string, files: any[]): string {
        const fileHashes = files.map(f => f.content || '').join('|');
        return `${prompt}-${fileHashes}`;
    }

    private async waitForRateLimit(): Promise<void> {
        const remainingRequests = await this.limiter.removeTokens(1);
        if (remainingRequests < 0) {
            const error = new Error('Rate limit exceeded') as ChatError;
            error.status = 429;
            error.retryAfter = Math.abs(remainingRequests) * 1000;
            throw error;
        }
    }

    private async sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async retryWithBackoff<T>(
        operation: () => Promise<T>,
        retryCount = 0
    ): Promise<T> {
        try {
            return await operation();
        } catch (error: any) {
            if (retryCount >= this.MAX_RETRIES) {
                throw error;
            }

            const backoffTime = error.retryAfter || this.INITIAL_BACKOFF * Math.pow(2, retryCount);
            console.log(`Retrying after ${backoffTime}ms (attempt ${retryCount + 1}/${this.MAX_RETRIES})`);
            await this.sleep(backoffTime);

            return this.retryWithBackoff(operation, retryCount + 1);
        }
    }

    async sendMessage(prompt: string, files: any[]): Promise<string | null> {
        return new Promise((resolve, reject) => {
            this.requestQueue = this.requestQueue
                .then(() => this._sendMessage(prompt, files))
                .then(resolve)
                .catch(reject);
        });
    }

    private async _sendMessage(prompt: string, files: any[]): Promise<string | null> {
        try {
            await this.waitForRateLimit();

            const cacheKey = this.getCacheKey(prompt, files);
            const cachedResponse = this.cache.get(cacheKey);
            if (cachedResponse) {
                return cachedResponse;
            }

            const fileContents = files.map(file => file.content || '').join('\n\n');
            const fullPrompt = `${prompt}\n\nContext from documents:\n${this.truncateText(fileContents)}`;

            const response = await this.retryWithBackoff(async () => {
                try {
                    const response = await fetch('/api/chat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            prompt: fullPrompt,
                        }),
                    });

                    if (!response.ok) {
                        const error = new Error(`HTTP error! status: ${response.status}`) as ChatError;
                        error.status = response.status;
                        if (response.status === 429) {
                            const retryAfter = parseInt(response.headers.get('retry-after') || '5', 10);
                            error.retryAfter = retryAfter * 1000;
                        }
                        throw error;
                    }

                    const data = await response.json();
                    if (!data.response) {
                        throw new Error('Invalid response format from server');
                    }

                    this.cache.set(cacheKey, data.response);
                    return data.response;

                } catch (error: any) {
                    if (error instanceof TypeError && error.message.includes('fetch')) {
                        const networkError = new Error('Network error: Failed to reach the server') as ChatError;
                        networkError.status = 0;
                        throw networkError;
                    }
                    throw error;
                }
            });

            return response;

        } catch (error: any) {
            console.error('Error in sendMessage:', error);
            
            const enhancedError = new Error(
                error.status === 429 ? `Rate limit exceeded. Retrying in ${Math.ceil(error.retryAfter / 1000)} seconds...` :
                error.status === 0 ? 'Network error: Please check your internet connection.' :
                error.status >= 500 ? 'Server error: Please try again later.' :
                'Failed to process request. Please try again.'
            ) as ChatError;
            
            enhancedError.status = error.status;
            enhancedError.retryAfter = error.retryAfter;
            throw enhancedError;
        }
    }

    private truncateText(text: string): string {
        const estimatedTokens = text.length / 4;
        if (estimatedTokens <= this.MAX_TOKENS_PER_REQUEST) {
            return text;
        }
        return text.slice(0, this.MAX_TOKENS_PER_REQUEST * 4) + '...';
    }
}

export const chatService = new ChatService(); 