#!/usr/bin/env python3
"""
Spaced repetition system for scheduling task reviews.
Analyzes user performance and schedules tasks for review based on forgetting curve.
"""

import os
import psycopg2
from datetime import datetime, timedelta
from dotenv import load_dotenv
import sys

# Load environment variables
load_dotenv()

def main():
    """Main function for spaced repetition scheduling."""
    
    if not os.getenv("SUPABASE_DB_URL"):
        print("Error: SUPABASE_DB_URL must be set")
        sys.exit(1)
    
    try:
        conn = psycopg2.connect(os.getenv("SUPABASE_DB_URL"))
        cur = conn.cursor()
        
        # Generate recommendations for all users
        schedule_reviews(cur)
        
        conn.commit()
        print("Spaced repetition scheduling completed successfully!")
        
    except Exception as e:
        print(f"Error during spaced repetition scheduling: {e}")
        if 'conn' in locals():
            conn.rollback()
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

def schedule_reviews(cur):
    """Schedule reviews for all users based on their performance."""
    
    # Get all users with recent activity
    cur.execute("""
        SELECT DISTINCT user_id 
        FROM attempts 
        WHERE ts > NOW() - INTERVAL '30 days'
    """)
    
    users = cur.fetchall()
    
    for (user_id,) in users:
        schedule_user_reviews(cur, user_id)

def schedule_user_reviews(cur, user_id):
    """Schedule reviews for a specific user."""
    
    # Get user's weak topics
    cur.execute("""
        SELECT topic, error_rate, attempts_count
        FROM weak_topics
        WHERE user_id = %s
        ORDER BY error_rate DESC
        LIMIT 5
    """, (user_id,))
    
    weak_topics = cur.fetchall()
    
    # Get tasks for weak topics
    for topic, error_rate, attempts_count in weak_topics:
        schedule_topic_reviews(cur, user_id, topic, error_rate, attempts_count)
    
    # Schedule regular spaced repetition for correctly solved tasks
    schedule_spaced_repetition(cur, user_id)

def schedule_topic_reviews(cur, user_id, topic, error_rate, attempts_count):
    """Schedule reviews for a specific weak topic."""
    
    # Get representative tasks from this topic
    cur.execute("""
        SELECT t.id, t.difficulty
        FROM tasks t
        LEFT JOIN attempts a ON t.id = a.task_id AND a.user_id = %s
        WHERE t.topic = %s
        AND (a.is_correct = FALSE OR a.id IS NULL)
        ORDER BY t.difficulty ASC
        LIMIT 3
    """, (user_id, topic))
    
    tasks = cur.fetchall()
    
    # Calculate review interval based on error rate
    base_interval = 1  # 1 day
    if error_rate > 0.7:
        interval = base_interval  # Review tomorrow
    elif error_rate > 0.5:
        interval = base_interval * 2  # Review in 2 days
    else:
        interval = base_interval * 3  # Review in 3 days
    
    next_review = datetime.now() + timedelta(days=interval)
    
    # Schedule reviews
    for task_id, difficulty in tasks:
        # Check if already scheduled
        cur.execute("""
            SELECT id FROM recommendations 
            WHERE user_id = %s AND task_id = %s AND next_review > NOW()
        """, (user_id, task_id))
        
        if not cur.fetchone():
            priority = 5 if error_rate > 0.7 else 4 if error_rate > 0.5 else 3
            
            cur.execute("""
                INSERT INTO recommendations (user_id, task_id, reason, priority, next_review)
                VALUES (%s, %s, %s, %s, %s)
            """, (user_id, task_id, 'weak_topic', priority, next_review))

def schedule_spaced_repetition(cur, user_id):
    """Schedule spaced repetition for correctly solved tasks."""
    
    # Get tasks that were solved correctly but need review
    cur.execute("""
        SELECT a.task_id, a.ts, COUNT(*) as correct_count
        FROM attempts a
        WHERE a.user_id = %s 
        AND a.is_correct = TRUE
        AND a.ts > NOW() - INTERVAL '30 days'
        GROUP BY a.task_id, a.ts
        HAVING COUNT(*) >= 2
        ORDER BY a.ts DESC
    """, (user_id,))
    
    tasks = cur.fetchall()
    
    for task_id, last_attempt, correct_count in tasks:
        # Calculate spaced repetition interval
        # Base intervals: 1, 3, 7, 14, 30 days
        intervals = [1, 3, 7, 14, 30]
        interval_index = min(correct_count - 1, len(intervals) - 1)
        interval = intervals[interval_index]
        
        next_review = last_attempt + timedelta(days=interval)
        
        # Only schedule if review is due soon
        if next_review <= datetime.now() + timedelta(days=2):
            # Check if already scheduled
            cur.execute("""
                SELECT id FROM recommendations 
                WHERE user_id = %s AND task_id = %s AND next_review > NOW()
            """, (user_id, task_id))
            
            if not cur.fetchone():
                cur.execute("""
                    INSERT INTO recommendations (user_id, task_id, reason, priority, next_review)
                    VALUES (%s, %s, %s, %s, %s)
                """, (user_id, task_id, 'spaced_repetition', 2, next_review))

if __name__ == "__main__":
    main()
