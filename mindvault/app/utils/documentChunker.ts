/**
 * Document chunking utilities
 * Implements intelligent document chunking and RAG for better context management
 */

import { DocumentFile } from '../prompts/shared';

export interface DocumentChunk {
  content: string;
  metadata: {
    documentName: string;
    documentType: string;
    chunkIndex: number;
    startChar: number;
    endChar: number;
    pageNumber?: number;
    sheetName?: string;
  };
}

export interface ChunkingOptions {
  maxChunkSize?: number;
  overlapSize?: number;
  questionType?: string;
}

/**
 * Default chunking options
 */
const DEFAULT_OPTIONS: Required<ChunkingOptions> = {
  maxChunkSize: 5000,
  overlapSize: 200,
  questionType: 'general'
};

/**
 * Chunk a document into smaller pieces
 */
export function chunkDocument(
  file: DocumentFile,
  options: ChunkingOptions = {}
): DocumentChunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const chunks: DocumentChunk[] = [];
  
  const content = file.content || '';
  const totalLength = content.length;
  
  if (totalLength <= opts.maxChunkSize) {
    // Document fits in one chunk
    return [{
      content,
      metadata: {
        documentName: file.name,
        documentType: file.type,
        chunkIndex: 0,
        startChar: 0,
        endChar: totalLength
      }
    }];
  }

  // Split into chunks with overlap
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < totalLength) {
    const endIndex = Math.min(startIndex + opts.maxChunkSize, totalLength);
    let chunkContent = content.substring(startIndex, endIndex);

    // Try to break at sentence boundaries
    if (endIndex < totalLength) {
      const lastPeriod = chunkContent.lastIndexOf('.');
      const lastNewline = chunkContent.lastIndexOf('\n');
      const breakPoint = Math.max(lastPeriod, lastNewline);
      
      if (breakPoint > opts.maxChunkSize * 0.8) {
        chunkContent = chunkContent.substring(0, breakPoint + 1);
        startIndex += breakPoint + 1;
      } else {
        startIndex = endIndex;
      }
    } else {
      startIndex = endIndex;
    }

    chunks.push({
      content: chunkContent.trim(),
      metadata: {
        documentName: file.name,
        documentType: file.type,
        chunkIndex: chunkIndex++,
        startChar: startIndex - chunkContent.length,
        endChar: startIndex
      }
    });

    // Add overlap for next chunk
    if (startIndex < totalLength && opts.overlapSize > 0) {
      startIndex = Math.max(0, startIndex - opts.overlapSize);
    }
  }

  return chunks;
}

/**
 * Score chunk relevance to a question
 */
export function scoreChunkRelevance(
  chunk: DocumentChunk,
  question: string
): number {
  const questionLower = question.toLowerCase();
  const contentLower = chunk.content.toLowerCase();
  
  let score = 0;
  
  // Extract keywords from question
  const questionWords = questionLower
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !['what', 'who', 'where', 'when', 'why', 'how', 'the', 'and', 'or', 'but'].includes(word));

  // Count keyword matches
  for (const word of questionWords) {
    const matches = (contentLower.match(new RegExp(word, 'g')) || []).length;
    score += matches * 2;
  }

  // Boost score for financial terms in financial questions
  if (questionLower.includes('revenue') || questionLower.includes('arr') || questionLower.includes('financial')) {
    const financialTerms = ['revenue', 'arr', 'financial', 'million', 'billion', 'dollar', 'usd', 'aud', 'eur', 'growth', 'profit'];
    for (const term of financialTerms) {
      if (contentLower.includes(term)) {
        score += 3;
      }
    }
  }

  // Boost score for market terms in market questions
  if (questionLower.includes('market') || questionLower.includes('tam') || questionLower.includes('competitor')) {
    const marketTerms = ['market', 'tam', 'sam', 'som', 'competitor', 'customer', 'segment', 'growth'];
    for (const term of marketTerms) {
      if (contentLower.includes(term)) {
        score += 3;
      }
    }
  }

  return score;
}

/**
 * Select most relevant chunks for a question
 */
export function selectRelevantChunks(
  chunks: DocumentChunk[],
  question: string,
  maxChunks: number = 5
): DocumentChunk[] {
  // Score all chunks
  const scoredChunks = chunks.map(chunk => ({
    chunk,
    score: scoreChunkRelevance(chunk, question)
  }));

  // Sort by score (descending)
  scoredChunks.sort((a, b) => b.score - a.score);

  // Return top N chunks
  return scoredChunks
    .slice(0, maxChunks)
    .map(item => item.chunk);
}

/**
 * Chunk documents and select relevant sections for a question
 */
export function prepareDocumentsForQuestion(
  files: DocumentFile[],
  question: string,
  options: ChunkingOptions = {}
): DocumentFile[] {
  if (!files || files.length === 0) {
    return [];
  }

  // Merge options with defaults
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // For small documents, return as-is
  const totalSize = files.reduce((sum, file) => sum + (file.content?.length || 0), 0);
  if (totalSize <= opts.maxChunkSize || totalSize <= 10000) {
    return files;
  }

  // Chunk documents and select relevant chunks
  const preparedFiles: DocumentFile[] = [];

  for (const file of files) {
    const chunks = chunkDocument(file, opts);
    const relevantChunks = selectRelevantChunks(chunks, question, 3);

    if (relevantChunks.length > 0) {
      // Combine relevant chunks
      const combinedContent = relevantChunks
        .map((chunk, idx) => `[Chunk ${chunk.metadata.chunkIndex + 1} from ${file.name}]\n${chunk.content}`)
        .join('\n\n---\n\n');

      preparedFiles.push({
        name: file.name,
        type: file.type,
        content: combinedContent
      });
    }
  }

  return preparedFiles.length > 0 ? preparedFiles : files;
}

