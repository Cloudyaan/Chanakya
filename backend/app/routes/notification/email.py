import os
import msal
import requests
import json
from datetime import datetime

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
                overflow: hidden; /* Important: Contains floats */
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
                clear: both; /* Add clear to prevent floating issues */
                display: block; /* Ensure items are block-level elements */
                width: 100%; /* Full width to prevent nesting */
                box-sizing: border-box; /* Include padding in width calculation */
                float: none; /* Prevent floating */
                position: relative; /* Position relative for absolute positioning of elements if needed */
                overflow: hidden; /* Contain any floated elements */
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
                overflow: hidden; /* Contain floated elements */
            }}
            .update-id {{
                font-family: monospace;
                color: #666;
                font-size: 0.85em;
                display: block; /* Force block display */
                margin-bottom: 5px;
            }}
            .update-desc {{
                margin-top: 10px;
                clear: both; /* Ensure it starts on a new line */
                display: block; /* Force block display */
            }}
            .footer {{
                text-align: center;
                padding: 20px;
                font-size: 0.8em;
                color: #666;
                background-color: #f5f5f5;
                border-radius: 0 0 6px 6px;
                clear: both; /* Ensure footer is properly positioned */
                display: block; /* Force block display */
            }}
            .badge {{
                display: inline-block;
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 0.75em;
                font-weight: 500;
                text-transform: uppercase;
                margin-right: 5px;
                float: none; /* Prevent floating */
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
                float: right; /* Float to right but contained by parent */
            }}
            .no-updates {{
                padding: 15px;
                text-align: center;
                background-color: #f9f9f9;
                border-radius: 4px;
                color: #666;
                display: block; /* Force block display */
                margin-bottom: 15px;
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
        has_updates = False
        
        html += """
            <div class="section">
                <h2>Message Center Announcements</h2>
        """
        
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
                    
                    # Ensure each update is properly closed with closing div tag
                    html += f"""
                    <div class="update-item">
                        <div class="update-title">{update.get('title', 'Untitled Update')}</div>
                        <div class="update-id">ID: {update.get('messageId', update.get('id', 'Unknown'))}</div>
                        <div class="update-meta">
                            <span class="badge {badge_class}">{action_type}</span>
                            <span class="badge badge-info">{formatted_category}</span>
                            <div class="date-info">Last Updated: {published_date}</div>
                        </div>
                        <div class="update-desc">{update.get('description', 'No description available.')[:200]}...</div>
                    </div>
                    """  # Ensure this closing div tag is properly included
        
        if not has_updates:
            html += """
                <div class="no-updates">
                    No message center announcements found for the selected time period.
                </div>
            """
        
        html += "</div>"  # Close the section div properly
    
    # Windows Updates
    if 'windows-updates' in setting['update_types']:
        has_updates = False
        
        html += """
            <div class="section">
                <h2>Windows Updates</h2>
        """
        
        for tenant_id, updates in updates_data['windows_updates'].items():
            if updates:
                has_updates = True
                
                for update in updates:
                    # Try to format date nicely
                    try:
                        start_date = datetime.fromisoformat(update.get('startDate', '')).strftime('%Y-%m-%d')
                    except (ValueError, TypeError):
                        start_date = update.get('startDate', 'Unknown Date')
                    
                    # Ensure each windows update is properly closed
                    html += f"""
                    <div class="update-item">
                        <div class="update-title">{update.get('title', 'Untitled Update')}</div>
                        <div class="update-meta">
                            <span class="badge badge-product">{update.get('productName', 'Unknown Product')}</span>
                            <span class="badge badge-status">{update.get('status', 'Unknown Status')}</span>
                            <div class="date-info">Date: {start_date}</div>
                        </div>
                        <div class="update-desc">{update.get('description', 'No description available.')[:200]}...</div>
                    </div>
                    """  # Ensure proper closing div tag
        
        if not has_updates:
            html += """
                <div class="no-updates">
                    No Windows updates found for the selected time period.
                </div>
            """
        
        html += "</div>"  # Close the section div
    
    # M365 News
    if 'news' in setting['update_types']:
        has_updates = False
        
        html += """
            <div class="section">
                <h2>Microsoft 365 News</h2>
        """
        
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
                    
                    # Ensure news items have proper closing div tags
                    html += f"""
                    <div class="update-item">
                        <div class="update-title">{item.get('title', 'Untitled News')}</div>
                        <div class="update-meta">
                            {category_badges}
                            <div class="date-info">Published: {published_date}</div>
                        </div>
                        <div class="update-desc">{item.get('summary', 'No summary available.')[:200]}...</div>
                        <div><a href="{item.get('link', '#')}">Read more</a></div>
                    </div>
                    """  # Ensure proper closing div tag
        
        if not has_updates:
            html += """
                <div class="no-updates">
                    No Microsoft 365 news found for the selected time period.
                </div>
            """
        
        html += "</div>"  # Close the section div
    
    # Footer - ensure proper closing of all tags
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

def get_ms_graph_token():
    """Get a Microsoft Graph API access token using MSAL"""
    # Get settings from environment variables
    client_id = os.environ.get('MS_CLIENT_ID')
    client_secret = os.environ.get('MS_CLIENT_SECRET')
    tenant_id = os.environ.get('MS_TENANT_ID')
    authority = f"https://login.microsoftonline.com/{tenant_id}"
    scope = ["https://graph.microsoft.com/.default"]
    
    # Create MSAL app
    app = msal.ConfidentialClientApplication(
        client_id,
        authority=authority,
        client_credential=client_secret
    )
    
    # Get token
    result = app.acquire_token_for_client(scopes=scope)
    
    if "access_token" in result:
        return result["access_token"]
    else:
        print(f"Error getting token: {result.get('error')}")
        print(f"Error description: {result.get('error_description')}")
        return None

def send_email_with_ms_graph(recipient, subject, html_content):
    """Send an email using Microsoft Graph API"""
    token = get_ms_graph_token()
    if not token:
        print("Failed to get Microsoft Graph access token")
        return False
    
    # Get sender email from environment variable
    sender_email = os.environ.get('MS_FROM_EMAIL')
    
    # Prepare the email message
    email_message = {
        "message": {
            "subject": subject,
            "body": {
                "contentType": "HTML",
                "content": html_content
            },
            "toRecipients": [
                {
                    "emailAddress": {
                        "address": recipient
                    }
                }
            ],
            "from": {
                "emailAddress": {
                    "address": sender_email
                }
            }
        }
    }
    
    # Send the email using Microsoft Graph API
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.post(
            'https://graph.microsoft.com/v1.0/users/' + sender_email + '/sendMail',
            headers=headers,
            json=email_message
        )
        
        if response.status_code >= 200 and response.status_code < 300:
            print(f"Email sent successfully to {recipient}")
            return True
        else:
            print(f"Failed to send email. Status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"Error sending email with Microsoft Graph: {e}")
        return False
