
from datetime import datetime, timedelta

def get_time_period_for_frequency(frequency, check_period=True):
    """Get the appropriate time period based on notification frequency"""
    if not check_period:
        # Default to 7 days if not checking period (backward compatibility)
        return 7
    
    # Return days based on frequency
    if frequency == "Daily":
        return 1  # Last 24 hours for daily
    elif frequency in ["Weekly", "Monthly"]:
        return 7  # Last 7 days for weekly and monthly
    else:
        return 7  # Default to 7 days for any other frequency

def get_exact_date_for_filter(frequency):
    """Get the exact date to filter from based on frequency"""
    now = datetime.now()
    
    if frequency == "Daily":
        # Use beginning of yesterday (00:00:00)
        yesterday_start = (now - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        return yesterday_start.isoformat()
    elif frequency in ["Weekly", "Monthly"]:
        # Use beginning of 7 days ago (00:00:00)
        week_ago_start = (now - timedelta(days=7)).replace(hour=0, minute=0, second=0, microsecond=0)
        return week_ago_start.isoformat()
    else:
        # Default to beginning of yesterday
        yesterday_start = (now - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        return yesterday_start.isoformat()
