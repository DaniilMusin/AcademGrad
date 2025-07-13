#!/usr/bin/env python3
"""
Spaced Repetition Algorithm Implementation for EGE AI Platform
Uses modified SM-2 algorithm for optimal learning intervals
"""

import os
import json
import math
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, asdict
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

@dataclass
class SpacedRepetitionData:
    """Data structure for spaced repetition tracking"""
    user_id: str
    task_id: int
    repetition_count: int
    easiness_factor: float
    interval_days: int
    next_review_date: datetime
    last_review_date: datetime
    performance_rating: int  # 1-5 scale
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for database storage"""
        data = asdict(self)
        data['next_review_date'] = self.next_review_date.isoformat()
        data['last_review_date'] = self.last_review_date.isoformat()
        return data

class SpacedRepetitionManager:
    """Manages spaced repetition scheduling and algorithms"""
    
    def __init__(self):
        """Initialize with Supabase client"""
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
        
        self.supabase: Client = create_client(supabase_url, supabase_key)
        
        # SM-2 algorithm constants
        self.MIN_EASINESS_FACTOR = 1.3
        self.INITIAL_EASINESS_FACTOR = 2.5
        self.INITIAL_INTERVAL = 1
        self.SECOND_INTERVAL = 6
        
    def calculate_next_review(self, 
                            repetition_count: int, 
                            easiness_factor: float,
                            performance_rating: int) -> Tuple[int, float]:
        """
        Calculate next review interval using SM-2 algorithm
        
        Args:
            repetition_count: Number of previous reviews
            easiness_factor: Current easiness factor (1.3 - 2.5)
            performance_rating: User performance (1-5)
            
        Returns:
            Tuple of (interval_days, new_easiness_factor)
        """
        # Update easiness factor based on performance
        new_easiness_factor = easiness_factor + (0.1 - (5 - performance_rating) * (0.08 + (5 - performance_rating) * 0.02))
        new_easiness_factor = max(self.MIN_EASINESS_FACTOR, new_easiness_factor)
        
        # Calculate interval based on repetition count
        if repetition_count == 0:
            interval = self.INITIAL_INTERVAL
        elif repetition_count == 1:
            interval = self.SECOND_INTERVAL
        else:
            # For repetitions > 1, multiply previous interval by easiness factor
            previous_interval = self.get_previous_interval(repetition_count - 1, easiness_factor)
            interval = math.ceil(previous_interval * new_easiness_factor)
        
        # If performance is poor (< 3), reset to beginning
        if performance_rating < 3:
            interval = self.INITIAL_INTERVAL
            repetition_count = 0
            
        return interval, new_easiness_factor
    
    def get_previous_interval(self, repetition_count: int, easiness_factor: float) -> int:
        """Get interval for previous repetition"""
        if repetition_count == 0:
            return self.INITIAL_INTERVAL
        elif repetition_count == 1:
            return self.SECOND_INTERVAL
        else:
            return math.ceil(self.get_previous_interval(repetition_count - 1, easiness_factor) * easiness_factor)
    
    def schedule_review(self, user_id: str, task_id: int, performance_rating: int) -> SpacedRepetitionData:
        """
        Schedule next review for a task based on performance
        
        Args:
            user_id: User UUID
            task_id: Task ID
            performance_rating: Performance rating (1-5)
            
        Returns:
            SpacedRepetitionData with next review scheduled
        """
        # Get existing data or create new
        existing_data = self.get_repetition_data(user_id, task_id)
        
        if existing_data:
            repetition_count = existing_data.repetition_count + 1
            easiness_factor = existing_data.easiness_factor
        else:
            repetition_count = 0
            easiness_factor = self.INITIAL_EASINESS_FACTOR
        
        # Calculate next review
        interval_days, new_easiness_factor = self.calculate_next_review(
            repetition_count, easiness_factor, performance_rating
        )
        
        # Create new data
        now = datetime.now()
        next_review = now + timedelta(days=interval_days)
        
        data = SpacedRepetitionData(
            user_id=user_id,
            task_id=task_id,
            repetition_count=repetition_count,
            easiness_factor=new_easiness_factor,
            interval_days=interval_days,
            next_review_date=next_review,
            last_review_date=now,
            performance_rating=performance_rating
        )
        
        # Save to database
        self.save_repetition_data(data)
        
        return data
    
    def get_repetition_data(self, user_id: str, task_id: int) -> Optional[SpacedRepetitionData]:
        """Get existing repetition data for user and task"""
        try:
            response = self.supabase.table("spaced_repetition") \
                .select("*") \
                .eq("user_id", user_id) \
                .eq("task_id", task_id) \
                .single() \
                .execute()
            
            if response.data:
                data = response.data
                return SpacedRepetitionData(
                    user_id=data['user_id'],
                    task_id=data['task_id'],
                    repetition_count=data['repetition_count'],
                    easiness_factor=data['easiness_factor'],
                    interval_days=data['interval_days'],
                    next_review_date=datetime.fromisoformat(data['next_review_date']),
                    last_review_date=datetime.fromisoformat(data['last_review_date']),
                    performance_rating=data['performance_rating']
                )
        except Exception as e:
            print(f"Error getting repetition data: {e}")
            return None
    
    def save_repetition_data(self, data: SpacedRepetitionData):
        """Save repetition data to database"""
        try:
            self.supabase.table("spaced_repetition") \
                .upsert(data.to_dict()) \
                .execute()
        except Exception as e:
            print(f"Error saving repetition data: {e}")
    
    def get_due_reviews(self, user_id: str, limit: int = 10) -> List[Dict]:
        """Get tasks due for review for a user"""
        try:
            now = datetime.now().isoformat()
            response = self.supabase.table("spaced_repetition") \
                .select("*, tasks(title, topic, difficulty)") \
                .eq("user_id", user_id) \
                .lte("next_review_date", now) \
                .order("next_review_date", desc=False) \
                .limit(limit) \
                .execute()
            
            return response.data or []
        except Exception as e:
            print(f"Error getting due reviews: {e}")
            return []
    
    def get_user_stats(self, user_id: str) -> Dict:
        """Get spaced repetition statistics for user"""
        try:
            # Total reviews
            total_response = self.supabase.table("spaced_repetition") \
                .select("id", count="exact") \
                .eq("user_id", user_id) \
                .execute()
            
            total_reviews = total_response.count or 0
            
            # Due reviews
            now = datetime.now().isoformat()
            due_response = self.supabase.table("spaced_repetition") \
                .select("id", count="exact") \
                .eq("user_id", user_id) \
                .lte("next_review_date", now) \
                .execute()
            
            due_reviews = due_response.count or 0
            
            # Average performance
            avg_response = self.supabase.rpc("get_average_performance", {"user_uuid": user_id}).execute()
            avg_performance = avg_response.data or 0
            
            return {
                "total_reviews": total_reviews,
                "due_reviews": due_reviews,
                "average_performance": avg_performance,
                "retention_rate": self.calculate_retention_rate(user_id)
            }
        except Exception as e:
            print(f"Error getting user stats: {e}")
            return {}
    
    def calculate_retention_rate(self, user_id: str) -> float:
        """Calculate retention rate for user"""
        try:
            # Get recent reviews (last 30 days)
            thirty_days_ago = (datetime.now() - timedelta(days=30)).isoformat()
            
            response = self.supabase.table("spaced_repetition") \
                .select("performance_rating") \
                .eq("user_id", user_id) \
                .gte("last_review_date", thirty_days_ago) \
                .execute()
            
            if not response.data:
                return 0.0
            
            # Calculate percentage of reviews with rating >= 3
            good_reviews = sum(1 for r in response.data if r['performance_rating'] >= 3)
            total_reviews = len(response.data)
            
            return (good_reviews / total_reviews) * 100 if total_reviews > 0 else 0.0
        except Exception as e:
            print(f"Error calculating retention rate: {e}")
            return 0.0
    
    def process_batch_reviews(self, batch_size: int = 100):
        """Process batch of due reviews and update recommendations"""
        try:
            # Get all due reviews
            now = datetime.now().isoformat()
            response = self.supabase.table("spaced_repetition") \
                .select("user_id, task_id, performance_rating") \
                .lte("next_review_date", now) \
                .limit(batch_size) \
                .execute()
            
            if not response.data:
                print("No due reviews found")
                return
            
            # Process each review
            for review in response.data:
                # Create recommendation
                recommendation = {
                    "user_id": review['user_id'],
                    "task_id": review['task_id'],
                    "reason": "spaced_repetition",
                    "priority": 5 if review['performance_rating'] < 3 else 3,
                    "next_review": datetime.now().isoformat()
                }
                
                # Insert recommendation
                self.supabase.table("recommendations") \
                    .upsert(recommendation) \
                    .execute()
            
            print(f"Processed {len(response.data)} due reviews")
            
        except Exception as e:
            print(f"Error processing batch reviews: {e}")

def main():
    """Main function for CLI usage"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Spaced Repetition Management")
    parser.add_argument("--user-id", help="User ID for operations")
    parser.add_argument("--task-id", type=int, help="Task ID for scheduling")
    parser.add_argument("--rating", type=int, choices=[1,2,3,4,5], help="Performance rating")
    parser.add_argument("--stats", action="store_true", help="Show user statistics")
    parser.add_argument("--due", action="store_true", help="Show due reviews")
    parser.add_argument("--batch", action="store_true", help="Process batch reviews")
    
    args = parser.parse_args()
    
    manager = SpacedRepetitionManager()
    
    if args.stats and args.user_id:
        stats = manager.get_user_stats(args.user_id)
        print(json.dumps(stats, indent=2))
    
    elif args.due and args.user_id:
        due_reviews = manager.get_due_reviews(args.user_id)
        print(json.dumps(due_reviews, indent=2, default=str))
    
    elif args.user_id and args.task_id and args.rating:
        data = manager.schedule_review(args.user_id, args.task_id, args.rating)
        print(f"Next review scheduled for {data.next_review_date}")
    
    elif args.batch:
        manager.process_batch_reviews()
    
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
