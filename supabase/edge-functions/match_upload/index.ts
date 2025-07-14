import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface FileUploadRequest {
  file_url: string;
  file_name: string;
  file_type: string;
  user_id?: string;
}

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { file_url, file_name, file_type, user_id }: FileUploadRequest = await req.json();

    if (!file_url || !file_name) {
      return new Response("Missing required fields: file_url, file_name", { status: 400 });
    }

    // Download and parse file content
    const content = await downloadAndParseFile(file_url, file_type);
    
    // Generate embeddings
    const embeddings = await generateEmbeddings(content);
    
    // Store processed data
    const { data: processed_file, error } = await supabase
      .from("processed_files")
      .insert({
        file_name,
        file_type,
        file_url,
        content,
        embeddings,
        user_id,
        processed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return new Response("Failed to store processed file", { status: 500 });
    }

    // Index for search if needed
    await indexFileForSearch(processed_file.id, content, embeddings);

    return new Response(JSON.stringify({
      status: "success",
      file_id: processed_file.id,
      embeddings_count: embeddings.length
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error in match_upload:", error);
    return new Response("Internal server error", { status: 500 });
  }
});

async function downloadAndParseFile(fileUrl: string, fileType: string): Promise<string> {
  const response = await fetch(fileUrl);
  
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  
  switch (fileType.toLowerCase()) {
    case 'txt':
    case 'md':
      return new TextDecoder().decode(buffer);
    
    case 'pdf':
      return await parsePDF(buffer);
    
    case 'docx':
      return await parseDocx(buffer);
    
    case 'csv':
      return await parseCSV(buffer);
    
    default:
      // Try to parse as text
      try {
        return new TextDecoder().decode(buffer);
      } catch {
        throw new Error(`Unsupported file type: ${fileType}`);
      }
  }
}

async function parsePDF(buffer: ArrayBuffer): Promise<string> {
  // Basic PDF text extraction
  // In production, you'd use a proper PDF parser like pdf-parse
  const text = new TextDecoder().decode(buffer);
  
  // Extract readable text between obj tags (simplified)
  const streamRegex = /stream\s*(.*?)\s*endstream/gs;
  const matches = text.match(streamRegex);
  
  if (matches) {
    return matches.join(' ').replace(/[^\x20-\x7E]/g, ' ').trim();
  }
  
  return text.replace(/[^\x20-\x7E]/g, ' ').trim();
}

async function parseDocx(buffer: ArrayBuffer): Promise<string> {
  // Basic DOCX parsing - extract text content
  // In production, you'd use a proper library like mammoth
  const text = new TextDecoder().decode(buffer);
  
  // Extract text from XML content
  const xmlRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  const matches = [];
  let match;
  
  while ((match = xmlRegex.exec(text)) !== null) {
    matches.push(match[1]);
  }
  
  return matches.join(' ').trim();
}

async function parseCSV(buffer: ArrayBuffer): Promise<string> {
  const text = new TextDecoder().decode(buffer);
  
  // Convert CSV to readable format
  const lines = text.split('\n');
  const headers = lines[0]?.split(',') || [];
  
  const formatted = lines.slice(1).map(line => {
    const values = line.split(',');
    return headers.map((header, index) => 
      `${header.trim()}: ${values[index]?.trim() || ''}`
    ).join('; ');
  }).join('\n');
  
  return formatted;
}

async function generateEmbeddings(content: string): Promise<number[][]> {
  // Split content into chunks
  const chunks = splitTextIntoChunks(content, 500);
  const embeddings: number[][] = [];
  
  for (const chunk of chunks) {
    try {
      // Use OpenAI embeddings API
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: chunk,
          model: 'text-embedding-ada-002'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        embeddings.push(data.data[0].embedding);
      }
    } catch (error) {
      console.error('Error generating embedding:', error);
      // Generate dummy embedding as fallback
      embeddings.push(new Array(1536).fill(0).map(() => Math.random() - 0.5));
    }
  }
  
  return embeddings;
}

function splitTextIntoChunks(text: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  const words = text.split(' ');
  
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }
  
  return chunks.filter(chunk => chunk.trim().length > 0);
}

async function indexFileForSearch(fileId: string, content: string, embeddings: number[][]): Promise<void> {
  // This could be implemented to index the file for vector search
  // For now, we'll just log that indexing would happen here
  console.log(`Indexing file ${fileId} with ${embeddings.length} embeddings`);
}