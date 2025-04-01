
"""
Email template and date filtering fixes for notification system

This script contains functions to:
1. Properly format email content without incorrect nesting
2. Fix date filtering to properly handle "yesterday" for daily frequency
"""
import datetime

def fix_email_template(html_content):
    """
    Fix the email template to remove incorrect nesting and indentation.
    
    Args:
        html_content: The original HTML content
        
    Returns:
        Fixed HTML content with proper structure
    """
    # Replace any nested indentation with flat structure
    # This is a simplified approach - you might need to adjust based on your HTML structure
    if not html_content:
        return ""
    
    # Remove nested blockquote elements that cause indentation
    fixed_html = html_content.replace("<blockquote>", "").replace("</blockquote>", "")
    
    # Ensure each update is at the same level
    fixed_html = fixed_html.replace("<div style='margin-left: 20px;'>", "<div>")
    fixed_html = fixed_html.replace("<div style=\"margin-left: 20px;\">", "<div>")
    
    # Clean up any excessive indentation in the rendered HTML
    fixed_html = fixed_html.replace("  ", " ")
    
    return fixed_html

def get_yesterday_date_range():
    """
    Get yesterday's date range (from 00:00:00 to 23:59:59)
    
    Returns:
        Tuple of (start_date, end_date) for yesterday
    """
    # Get current date
    today = datetime.datetime.now().date()
    
    # Calculate yesterday
    yesterday = today - datetime.timedelta(days=1)
    
    # Create datetime objects for start and end of yesterday
    start_datetime = datetime.datetime.combine(yesterday, datetime.time.min)  # 00:00:00
    end_datetime = datetime.datetime.combine(yesterday, datetime.time.max)    # 23:59:59
    
    return start_datetime, end_datetime

def filter_updates_for_daily_frequency(updates, frequency="Daily"):
    """
    Filter updates based on frequency, ensuring Daily uses yesterday's complete day
    
    Args:
        updates: List of updates to filter
        frequency: Notification frequency (Daily, Weekly, etc.)
        
    Returns:
        Filtered list of updates based on the frequency
    """
    if not updates:
        return []
    
    if frequency != "Daily":
        # For other frequencies, use the existing logic
        return updates
        
    # For daily, filter to only include yesterday's updates
    start_date, end_date = get_yesterday_date_range()
    
    # Filter updates based on publishedDate or lastModifiedDateTime
    filtered_updates = []
    for update in updates:
        # Try different date fields - publishedDate is primary
        update_date_str = update.get('publishedDate') or update.get('lastModifiedDateTime')
        
        if not update_date_str:
            continue
            
        try:
            # Parse the date string to a datetime object
            update_date = datetime.datetime.fromisoformat(update_date_str.replace('Z', '+00:00'))
            
            # Convert to local datetime for comparison
            update_date = update_date.replace(tzinfo=None)
            
            # Check if it's within yesterday
            if start_date <= update_date <= end_date:
                filtered_updates.append(update)
        except (ValueError, TypeError) as e:
            print(f"Error parsing date {update_date_str}: {e}")
            continue
            
    return filtered_updates

# Add this function to your backend notification code
def format_updates_email(updates, tenant_name):
    """
    Format updates for email with proper structure avoiding nested content
    
    Args:
        updates: List of update objects
        tenant_name: Name of the tenant for the heading
        
    Returns:
        Properly formatted HTML content for email
    """
    if not updates:
        return f"<p>No updates found for tenant: {tenant_name}</p>"
    
    html = f"<h2>Updates for {tenant_name}</h2>"
    
    # Process each update at the same level (no nesting)
    for update in updates:
        id_text = update.get('messageId') or update.get('id', 'N/A')
        title = update.get('title', 'No Title')
        action_type = update.get('actionType', '')
        category = update.get('category', '')
        updated_date = update.get('publishedDate') or update.get('lastModifiedDateTime', 'N/A')
        
        # Try to format the date nicely
        try:
            date_obj = datetime.datetime.fromisoformat(updated_date.replace('Z', '+00:00'))
            formatted_date = date_obj.strftime('%Y-%m-%d')
        except (ValueError, TypeError):
            formatted_date = updated_date
            
        # Create badge classes for styling
        badge_class = "primary"
        if action_type == "Action Required":
            badge_class = "danger"
        elif action_type == "Plan for Change":
            badge_class = "warning"
            
        # Format category nicely
        if category == "stayInformed":
            display_category = "Stay Informed"
        elif category == "planForChange":
            display_category = "Plan For Change"
        elif category == "preventOrFixIssue":
            display_category = "Prevent Or Fix Issue"
        else:
            display_category = category
            
        # Add the update at the root level (not nested)
        html += f"""
        <div style="margin-bottom: 20px; border-top: 1px solid #eee; padding-top: 10px;">
            <h3>{title}</h3>
            <p>ID: {id_text}</p>
            <p>
                <span style="background-color: {'#dc3545' if badge_class == 'danger' else '#ffc107' if badge_class == 'warning' else '#0d6efd'}; 
                      color: {'white' if badge_class == 'danger' or badge_class == 'primary' else '#212529'}; 
                      padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-right: 10px;">
                    {action_type or 'Informational'}
                </span>
                <span style="background-color: #e9ecef; color: #212529; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                    {display_category}
                </span>
            </p>
            <p>Last Updated: {formatted_date}</p>
            <div>{update.get('description', '')}</div>
        </div>
        """
        
    return html
