import { encode } from 'gpt-tokenizer';

interface DocumentChunk {
    content: string;
    tokenCount: number;
    summary?: string;
}

interface ProcessedDocument {
    originalContent: string;
    chunks: DocumentChunk[];
    totalTokens: number;
    summary?: string;
}

export class DocumentService {
    private readonly MAX_TOKENS_PER_CHUNK = 1000;
    private readonly MAX_TOTAL_TOKENS = 4000;

    private cleanText(text: string): string {
        return text
            .replace(/\s+/g, ' ')           // Replace multiple spaces with single space
            .replace(/[\r\n]+/g, '\n')      // Normalize line breaks
            .replace(/[^\S\r\n]+/g, ' ')    // Replace multiple spaces (except newlines) with single space
            .trim();
    }

    private async summarizeContent(content: string): Promise<string> {
        try {
            const response = await fetch('/api/summarize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content }),
            });

            if (!response.ok) {
                throw new Error('Failed to summarize content');
            }

            const data = await response.json();
            return data.summary;
        } catch (error) {
            console.error('Error summarizing content:', error);
            return '';
        }
    }

    private chunkContent(content: string): DocumentChunk[] {
        const chunks: DocumentChunk[] = [];
        const words = content.split(' ');
        let currentChunk = '';
        let currentTokenCount = 0;

        for (const word of words) {
            const wordTokens = encode(word + ' ').length;
            
            if (currentTokenCount + wordTokens > this.MAX_TOKENS_PER_CHUNK) {
                chunks.push({
                    content: currentChunk.trim(),
                    tokenCount: currentTokenCount
                });
                currentChunk = word + ' ';
                currentTokenCount = wordTokens;
            } else {
                currentChunk += word + ' ';
                currentTokenCount += wordTokens;
            }
        }

        if (currentChunk) {
            chunks.push({
                content: currentChunk.trim(),
                tokenCount: currentTokenCount
            });
        }

        return chunks;
    }

    async processDocument(file: any): Promise<ProcessedDocument> {
        try {
            const content = await this.extractContent(file);
            const cleanedContent = this.cleanText(content);
            const totalTokens = encode(cleanedContent).length;

            let chunks: DocumentChunk[] = [];
            let summary: string | undefined;

            if (totalTokens > this.MAX_TOTAL_TOKENS) {
                // If content is too large, create chunks and generate a summary
                chunks = this.chunkContent(cleanedContent);
                summary = await this.summarizeContent(cleanedContent);
            } else {
                // If content is small enough, keep it as a single chunk
                chunks = [{
                    content: cleanedContent,
                    tokenCount: totalTokens
                }];
            }

            return {
                originalContent: cleanedContent,
                chunks,
                totalTokens,
                summary
            };
        } catch (error) {
            console.error('Error processing document:', error);
            throw new Error('Failed to process document');
        }
    }

    private async extractContent(file: any): Promise<string> {
        // For now, assume file.content contains the text
        // In a real implementation, you would handle different file types here
        return file.content || '';
    }

    async processDocuments(files: any[]): Promise<ProcessedDocument[]> {
        return Promise.all(files.map(file => this.processDocument(file)));
    }

    findRelevantChunks(documents: ProcessedDocument[], question: string): string[] {
        const relevantChunks: string[] = [];
        const questionTokens = encode(question).length;
        let totalTokens = questionTokens;

        for (const doc of documents) {
            // If we have a summary and the content is large, use the summary
            if (doc.summary && doc.totalTokens > this.MAX_TOTAL_TOKENS) {
                const summaryTokens = encode(doc.summary).length;
                if (totalTokens + summaryTokens <= this.MAX_TOTAL_TOKENS) {
                    relevantChunks.push(doc.summary);
                    totalTokens += summaryTokens;
                }
                continue;
            }

            // Otherwise, use the chunks
            for (const chunk of doc.chunks) {
                if (totalTokens + chunk.tokenCount <= this.MAX_TOTAL_TOKENS) {
                    relevantChunks.push(chunk.content);
                    totalTokens += chunk.tokenCount;
                } else {
                    break;
                }
            }
        }

        return relevantChunks;
    }
}

export const documentService = new DocumentService(); 