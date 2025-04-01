
import json
from datetime import datetime

# Helper function to ensure arrays are properly handled
def ensureArray(value):
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, list) else []
        except json.JSONDecodeError:
            return []
    return []

# Helper to normalize legacy 'Monthly' frequency to 'Weekly'
def normalizeFrequency(frequency):
    return 'Weekly' if frequency == 'Monthly' else frequency

def create_email_html(setting, updates_data):
    """Create HTML email content for the notification"""
    # Get frequency for the email header
    frequency = setting.get('frequency', 'Regular')
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Microsoft 365 Updates</title>
        <style>
            body {{
                font-family: 'Segoe UI', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
                background-color: #f9f9f9;
            }}
            .container {{
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background-color: #ffffff;
            }}
            .header {{
                background-color: #6E59A5;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 6px 6px 0 0;
            }}
            .section {{
                margin-bottom: 30px;
                border-bottom: 1px solid #eee;
                padding-bottom: 20px;
            }}
            .section h2 {{
                color: #6E59A5;
                border-bottom: 2px solid #6E59A5;
                padding-bottom: 8px;
                margin-top: 30px;
            }}
            .update-item {{
                padding: 15px;
                margin-bottom: 15px;
                background-color: #f5f5f5;
                border-left: 4px solid #6E59A5;
                border-radius: 4px;
            }}
            .update-title {{
                font-weight: bold;
                margin-bottom: 5px;
                font-size: 16px;
            }}
            .update-meta {{
                font-size: 0.9em;
                color: #666;
                margin-bottom: 10px;
            }}
            .update-id {{
                font-family: monospace;
                color: #666;
                font-size: 0.85em;
            }}
            .update-desc {{
                margin-top: 10px;
            }}
            .footer {{
                text-align: center;
                padding: 20px;
                font-size: 0.8em;
                color: #666;
                background-color: #f5f5f5;
                border-radius: 0 0 6px 6px;
            }}
            .badge {{
                display: inline-block;
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 0.75em;
                font-weight: 500;
                text-transform: uppercase;
                margin-right: 5px;
            }}
            .badge-action-required {{
                background-color: #FDE1D3;
                color: #F97316;
            }}
            .badge-plan-change {{
                background-color: #E5DEFF;
                color: #8B5CF6;
            }}
            .badge-info {{
                background-color: #D3E4FD;
                color: #0EA5E9;
            }}
            .badge-status {{
                background-color: #F2FCE2;
                color: #2E7D32;
            }}
            .badge-product {{
                background-color: #FFDEE2;
                color: #D946EF;
            }}
            .date-info {{
                font-size: 0.85em;
                color: #666;
                text-align: right;
                float: right;
            }}
            .no-updates {{
                padding: 15px;
                text-align: center;
                background-color: #f9f9f9;
                border-radius: 4px;
                color: #666;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Microsoft 365 Updates</h1>
                <p>{frequency} Update Summary</p>
            </div>
    """
    
    # Message Center Updates
    if 'message-center' in setting['update_types']:
        html += """
            <div class="section">
                <h2>Message Center Announcements</h2>
        """
        
        has_updates = False
        
        for tenant_id, updates in updates_data['message_center'].items():
            if updates:
                has_updates = True
                
                for update in updates:
                    action_type = update.get('actionType', 'Informational')
                    badge_class = "badge-info"
                    
                    if action_type == 'Action Required':
                        badge_class = "badge-action-required"
                    elif action_type == 'Plan for Change':
                        badge_class = "badge-plan-change"
                    
                    category = update.get('category', 'General')
                    formatted_category = category
                    if category == 'stayInformed':
                        formatted_category = 'Stay Informed'
                    elif category == 'planForChange':
                        formatted_category = 'Plan For Change'
                    elif category == 'preventOrFixIssue':
                        formatted_category = 'Prevent Or Fix Issue'
                    
                    # Try to format date nicely
                    try:
                        published_date = datetime.fromisoformat(update.get('publishedDate', '')).strftime('%Y-%m-%d')
                    except (ValueError, TypeError):
                        published_date = update.get('publishedDate', 'Unknown Date')
                    
                    html += f"""
                    <div class="update-item">
                        <div class="update-title">{update.get('title', 'Untitled Update')}</div>
                        <div class="update-id">ID: {update.get('messageId', update.get('id', 'Unknown'))}</div>
                        <div class="update-meta">
                            <span class="badge {badge_class}">{action_type}</span>
                            <span class="badge badge-info">{formatted_category}</span>
                            <span class="date-info">Last Updated: {published_date}</span>
                        </div>
                        <div class="update-desc">{update.get('description', 'No description available.')[:200]}...</div>
                    </div>
                    """
        
        if not has_updates:
            html += """
                <div class="no-updates">
                    No message center announcements found for the selected time period.
                </div>
            """
        
        html += """
            </div>
        """
    
    # Windows Updates
    if 'windows-updates' in setting['update_types']:
        html += """
            <div class="section">
                <h2>Windows Updates</h2>
        """
        
        has_updates = False
        
        for tenant_id, updates in updates_data['windows_updates'].items():
            if updates:
                has_updates = True
                
                for update in updates:
                    # Try to format date nicely
                    try:
                        start_date = datetime.fromisoformat(update.get('startDate', '')).strftime('%Y-%m-%d')
                    except (ValueError, TypeError):
                        start_date = update.get('startDate', 'Unknown Date')
                    
                    html += f"""
                    <div class="update-item">
                        <div class="update-title">{update.get('title', 'Untitled Update')}</div>
                        <div class="update-meta">
                            <span class="badge badge-product">{update.get('productName', 'Unknown Product')}</span>
                            <span class="badge badge-status">{update.get('status', 'Unknown Status')}</span>
                            <span class="date-info">Date: {start_date}</span>
                        </div>
                        <div class="update-desc">{update.get('description', 'No description available.')[:200]}...</div>
                    </div>
                    """
        
        if not has_updates:
            html += """
                <div class="no-updates">
                    No Windows updates found for the selected time period.
                </div>
            """
        
        html += """
            </div>
        """
    
    # M365 News
    if 'news' in setting['update_types']:
        html += """
            <div class="section">
                <h2>Microsoft 365 News</h2>
        """
        
        has_updates = False
        
        for tenant_id, news_items in updates_data['m365_news'].items():
            if news_items:
                has_updates = True
                
                for item in news_items:
                    # Try to format date nicely
                    try:
                        published_date = datetime.fromisoformat(item.get('published_date', '')).strftime('%Y-%m-%d')
                    except (ValueError, TypeError):
                        published_date = item.get('published_date', 'Unknown Date')
                    
                    # Get categories if available
                    categories = item.get('categories', [])
                    if isinstance(categories, str):
                        try:
                            categories = json.loads(categories)
                        except:
                            categories = []
                    
                    category_badges = ""
                    if categories and len(categories) > 0:
                        for category in categories[:3]:  # Limit to first 3 categories
                            category_badges += f'<span class="badge badge-info">{category}</span> '
                    
                    html += f"""
                    <div class="update-item">
                        <div class="update-title">{item.get('title', 'Untitled News')}</div>
                        <div class="update-meta">
                            {category_badges}
                            <span class="date-info">Published: {published_date}</span>
                        </div>
                        <div class="update-desc">{item.get('summary', 'No summary available.')[:200]}...</div>
                        <div><a href="{item.get('link', '#')}">Read more</a></div>
                    </div>
                    """
        
        if not has_updates:
            html += """
                <div class="no-updates">
                    No Microsoft 365 news found for the selected time period.
                </div>
            """
        
        html += """
            </div>
        """
    
    # Footer
    html += f"""
            <div class="footer">
                <p>This email was sent as part of your Microsoft 365 notification settings.</p>
                <p>Update frequency: {setting['frequency']} | Date sent: {datetime.now().strftime('%Y-%m-%d %H:%M')}</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return html
