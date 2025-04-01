
import threading
import time
from datetime import datetime
import sqlite3
from app.database import get_db_connection
from backend.app.routes.notification.process import process_and_send_notification

# Start the notification scheduler thread
def run_notification_scheduler():
    """Run the notification scheduler thread"""
    print("Starting notification scheduler...")
    
    while True:
        try:
            # Check for notifications that need to be sent
            now = datetime.now()
            print(f"Running scheduled notifications at {now.isoformat()}")
            
            conn = get_db_connection()
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Get all notification settings
            cursor.execute('SELECT * FROM notification_settings')
            settings = cursor.fetchall()
            
            conn.close()
            
            # Process each setting
            for setting in settings:
                frequency = setting['frequency']
                
                # Send notifications based on frequency
                if frequency == 'Daily' and now.hour == 9:  # 9 AM daily
                    process_and_send_notification(setting['id'], check_period=True)
                
                elif frequency == 'Weekly' and now.weekday() == 0 and now.hour == 9:  # Monday at 9 AM
                    process_and_send_notification(setting['id'], check_period=True)
                
                elif frequency == 'Monthly' and now.day == 1 and now.hour == 9:  # 1st day of month at 9 AM
                    process_and_send_notification(setting['id'], check_period=True)
            
        except Exception as e:
            print(f"Error in notification scheduler: {e}")
        
        # Sleep for an hour before checking again
        time.sleep(3600)

# Start the scheduler in a background thread
scheduler_thread = threading.Thread(target=run_notification_scheduler)
scheduler_thread.daemon = True
scheduler_thread.start()
