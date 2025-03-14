import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import * as fs from 'fs';

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

// Configure Next.js to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: Request) {
  try {
    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Get file data
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Save file temporarily to disk
    const tempFilePath = join('/tmp', file.name);
    await writeFile(tempFilePath, buffer);
    
    // Upload file to OpenAI using the file path
    const openaiFile = await openai.files.create({
      file: fs.createReadStream(tempFilePath),
      purpose: 'assistants'
    });
    
    // Clean up the temporary file
    fs.unlinkSync(tempFilePath);
    
    return NextResponse.json({ 
      fileId: openaiFile.id,
      filename: file.name,
      size: file.size
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'File upload failed', details: (error as Error).message },
      { status: 500 }
    );
  }
} 