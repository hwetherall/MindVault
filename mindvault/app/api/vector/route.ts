import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Check for API key - server-side only, not exposed to client
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

// Extract project ID from the API key if it's a project-based key
// Project-based keys start with "sk-proj-"
if (apiKey.startsWith('sk-proj-')) {
  // The project ID is embedded in the key
  // We don't need to extract it, the OpenAI client will handle it
  console.log('Using project-based API key');
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey
});

export const maxDuration = 300; // Set maximum duration to 5 minutes
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { operation, ...data } = await request.json();

    switch (operation) {
      case 'createVectorStore':
        return await createVectorStore(data);
      case 'listFilesInVectorStore':
        return await listFilesInVectorStore(data);
      case 'searchVectorStore':
        return await searchVectorStore(data);
      case 'uploadFile':
        return await uploadFile(data);
      case 'addFileToVectorStore':
        return await addFileToVectorStore(data);
      case 'checkFileStatus':
        return await checkFileStatus(data);
      default:
        return NextResponse.json(
          { error: 'Invalid operation' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Vector API Error:', error);
    return NextResponse.json(
      { error: 'Vector operation failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// Vector store operations
async function createVectorStore(data: any) {
  const { name = 'mindvault_knowledge_base' } = data;
  
  try {
    // Try to find an existing vector store first
    const vectorStores = await openai.vectorStores.list();
    const existingStore = vectorStores.data.find(vs => vs.name === name);
    
    if (existingStore) {
      return NextResponse.json({ id: existingStore.id });
    }
    
    // Create a new vector store
    const vectorStore = await openai.vectorStores.create({
      name: name
    });
    
    return NextResponse.json({ id: vectorStore.id });
  } catch (error) {
    throw new Error(`Failed to create vector store: ${(error as Error).message}`);
  }
}

async function listFilesInVectorStore(data: any) {
  const { vectorStoreId } = data;
  
  try {
    const response = await openai.vectorStores.files.list(vectorStoreId);
    return NextResponse.json({ files: response.data });
  } catch (error) {
    throw new Error(`Failed to list files: ${(error as Error).message}`);
  }
}

async function searchVectorStore(data: any) {
  const { question, vectorStoreId } = data;
  
  try {
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: question,
      tools: [{
        type: "file_search",
        vector_store_ids: [vectorStoreId]
      }]
    });
    
    // Extract the assistant's response from the message
    const messageOutput = response.output.find(item => item.type === 'message');
    
    if (!messageOutput) {
      throw new Error('No message output found in response');
    }
    
    // Extract text content from the message
    let responseText = '';
    if (messageOutput.content && Array.isArray(messageOutput.content)) {
      responseText = messageOutput.content
        .filter(item => item.type === 'output_text')
        .map(item => item.text)
        .join('\n');
    }
    
    return NextResponse.json({ response: responseText });
  } catch (error) {
    throw new Error(`Failed to search vector store: ${(error as Error).message}`);
  }
}

async function uploadFile(data: any) {
  // This would need to be implemented with a form data handler
  // For now, return an error as this requires special handling
  return NextResponse.json(
    { error: 'File upload not implemented in this endpoint' },
    { status: 501 }
  );
}

async function addFileToVectorStore(data: any) {
  const { vectorStoreId, fileId } = data;
  
  try {
    // First check if file is already in the vector store
    const existingFiles = await openai.vectorStores.files.list(vectorStoreId);
    const fileExists = existingFiles.data.some(f => f.id === fileId);
    
    if (fileExists) {
      return NextResponse.json({ success: true, message: 'File already exists in vector store' });
    }
    
    // Add the file to the vector store
    await openai.vectorStores.files.create(
      vectorStoreId,
      { file_id: fileId }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    throw new Error(`Failed to add file to vector store: ${(error as Error).message}`);
  }
}

async function checkFileStatus(data: any) {
  const { vectorStoreId, fileId } = data;
  
  try {
    const files = await openai.vectorStores.files.list(vectorStoreId);
    const file = files.data.find(f => f.id === fileId);
    
    if (!file) {
      return NextResponse.json({ found: false, processed: false });
    }
    
    return NextResponse.json({ 
      found: true, 
      processed: file.status === 'completed',
      status: file.status
    });
  } catch (error) {
    throw new Error(`Failed to check file status: ${(error as Error).message}`);
  }
} 