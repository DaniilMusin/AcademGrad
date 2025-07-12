#!/usr/bin/env python3
"""
Script to generate embeddings for task chunks and store them in Supabase.
Processes task solutions and creates vector embeddings for RAG functionality.
"""

import os
import markdown
import psycopg2
import tiktoken
import openai
from bs4 import BeautifulSoup
from dotenv import load_dotenv
import time
import sys

# Load environment variables
load_dotenv()

def main():
    """Main function to generate embeddings for task chunks."""
    
    # Check required environment variables
    required_vars = ["SUPABASE_DB_URL", "OPENAI_API_KEY"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print(f"Error: Missing required environment variables: {', '.join(missing_vars)}")
        sys.exit(1)
    
    # Initialize connections
    try:
        conn = psycopg2.connect(os.getenv("SUPABASE_DB_URL"))
        cur = conn.cursor()
        enc = tiktoken.encoding_for_model("text-embedding-3-small")
        openai.api_key = os.getenv("OPENAI_API_KEY")
    except Exception as e:
        print(f"Error initializing connections: {e}")
        sys.exit(1)
    
    try:
        # Get tasks that don't have embeddings yet
        cur.execute("""
            SELECT t.id, t.solution_md 
            FROM tasks t 
            LEFT JOIN task_chunks tc ON t.id = tc.task_id 
            WHERE tc.task_id IS NULL
        """)
        
        tasks = cur.fetchall()
        
        if not tasks:
            print("No tasks to process - all tasks already have embeddings")
            return
        
        print(f"Processing {len(tasks)} tasks...")
        
        processed_count = 0
        
        for task_id, solution_md in tasks:
            try:
                # Convert markdown to plain text
                text = BeautifulSoup(markdown.markdown(solution_md), "html.parser").get_text()
                
                # Generate chunks
                chunks_generated = 0
                for chunk in chunks(text, max_tokens=400):
                    if len(chunk.strip()) < 50:  # Skip very short chunks
                        continue
                    
                    # Generate embedding
                    embedding = create_embedding(chunk)
                    
                    # Insert into database
                    cur.execute(
                        "INSERT INTO task_chunks (task_id, chunk, embedding) VALUES (%s, %s, %s)",
                        (task_id, chunk, embedding)
                    )
                    
                    chunks_generated += 1
                    
                    # Rate limiting - sleep to avoid OpenAI rate limits
                    time.sleep(0.1)
                
                processed_count += 1
                print(f"✓ Processed task {task_id}: {chunks_generated} chunks")
                
                # Commit after each task
                conn.commit()
                
            except Exception as e:
                print(f"✗ Error processing task {task_id}: {e}")
                conn.rollback()
                continue
        
        print(f"\nProcessed {processed_count}/{len(tasks)} tasks successfully!")
        
    except Exception as e:
        print(f"Error during processing: {e}")
    finally:
        cur.close()
        conn.close()

def chunks(text: str, max_tokens: int = 400):
    """Split text into chunks with specified maximum tokens."""
    enc = tiktoken.encoding_for_model("text-embedding-3-small")
    tokens = enc.encode(text)
    
    for i in range(0, len(tokens), max_tokens):
        chunk_tokens = tokens[i:i + max_tokens]
        yield enc.decode(chunk_tokens)

def create_embedding(text: str) -> list:
    """Create embedding for given text using OpenAI API."""
    try:
        response = openai.Embedding.create(
            input=text,
            model="text-embedding-3-small"
        )
        return response["data"][0]["embedding"]
    except Exception as e:
        print(f"Error creating embedding: {e}")
        raise

if __name__ == "__main__":
    main()
