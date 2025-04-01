
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

# Helper function to ensure text is properly sanitized
def sanitizeHtml(text):
    if not text:
        return ""
    
    # Replace problematic HTML entities and tags
    replacements = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '&': '&amp;',
    }
    
    for char, replacement in replacements.items():
        text = text.replace(char, replacement)
    
    return text

def create_email_html(setting, updates_data):
    """Create HTML email content with Adaptive Card-inspired styling"""
    frequency = normalizeFrequency(setting.get('frequency', 'Regular'))
    current_date = datetime.now().strftime('%Y-%m-%d %H:%M')
    
    # Adaptive Card-inspired styles
    container_style = """
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        background-color: #ffffff;
        font-family: 'Segoe UI', Arial, sans-serif;
    """
    header_style = """
        background-color: #6E59A5;
        color: white;
        padding: 20px;
        border-radius: 4px 4px 0 0;
        margin-bottom: 20px;
    """
    card_style = """
        background-color: #FFFFFF;
        border: 1px solid #DDDDDD;
        border-radius: 4px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        margin-bottom: 15px;
        overflow: hidden;
    """
    card_header_style = """
        background-color: #F3F2F1;
        padding: 12px 15px;
        border-bottom: 1px solid #DDDDDD;
        font-weight: 600;
    """
    card_body_style = """
        padding: 15px;
    """
    card_footer_style = """
        background-color: #F9F9F9;
        padding: 10px 15px;
        border-top: 1px solid #EEEEEE;
        font-size: 0.8em;
        color: #666666;
    """
    badge_style = """
        display: inline-block;
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 0.75em;
        font-weight: 600;
        margin-right: 8px;
        text-transform: uppercase;
    """
    action_required_style = "background-color: #FDE7E9; color: #A80000;"
    plan_change_style = "background-color: #E5DEFF; color: #8B5CF6;"
    informational_style = "background-color: #D3E4FD; color: #0EA5E9;"
    product_style = "background-color: #FFDEE2; color: #D946EF;"
    status_style = "background-color: #F2FCE2; color: #2E7D32;"
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Microsoft 365 Updates</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F3F2F1;">
        <div style="{container_style}">
            <div style="{header_style}">
                <h1 style="margin: 0; font-weight: 300;">Microsoft 365 Updates</h1>
                <p style="margin: 5px 0 0; font-size: 0.9em;">{frequency} Update Summary • {current_date}</p>
            </div>
    """
    
    def create_card(title, content, footer=None, accent_color="#6E59A5"):
        """Helper to create Adaptive Card-like elements"""
        nonlocal html
        html += f"""
        <div style="{card_style} border-left: 3px solid {accent_color};">
            <div style="{card_header_style}">
                {sanitizeHtml(title)}
            </div>
            <div style="{card_body_style}">
                {content}
            </div>
        """
        if footer:
            html += f"""
            <div style="{card_footer_style}">
                {footer}
            </div>
            """
        html += "</div>"
    
    # Message Center Updates
    if 'message-center' in setting['update_types']:
        html += f"""
        <div style="margin-bottom: 25px;">
            <h2 style="color: #6E59A5; margin-bottom: 15px;">Message Center Announcements</h2>
        """
        
        has_updates = False
        
        for tenant_id, tenant_updates in updates_data['message_center'].items():
            if isinstance(tenant_updates, list) and tenant_updates:
                has_updates = True
                
                for update in tenant_updates:
                    action_type = update.get('actionType', 'Informational')
                    badge_style_type = informational_style
                    accent_color = "#0EA5E9"  # Blue
                    
                    if action_type == 'Action Required':
                        badge_style_type = action_required_style
                        accent_color = "#A80000"  # Red
                    elif action_type == 'Plan for Change':
                        badge_style_type = plan_change_style
                        accent_color = "#8B5CF6"  # Purple
                    
                    category = update.get('category', 'General')
                    formatted_category = category
                    if category == 'stayInformed':
                        formatted_category = 'Stay Informed'
                    elif category == 'planForChange':
                        formatted_category = 'Plan For Change'
                    elif category == 'preventOrFixIssue':
                        formatted_category = 'Prevent Or Fix Issue'
                    
                    try:
                        published_date = datetime.fromisoformat(update.get('publishedDate', '')).strftime('%b %d, %Y')
                    except (ValueError, TypeError):
                        published_date = update.get('publishedDate', 'Unknown Date')
                    
                    # Sanitize description
                    description = sanitizeHtml(update.get('description', 'No description available.'))
                    description = description[:250] + ('...' if len(description) > 250 else '')
                    
                    content = f"""
                    <div style="margin-bottom: 10px;">
                        <span style="{badge_style} {badge_style_type}">{action_type}</span>
                        <span style="{badge_style} {informational_style}">{formatted_category}</span>
                    </div>
                    <div style="margin-bottom: 10px; color: #333333; line-height: 1.4;">
                        {description}
                    </div>
                    """
                    
                    footer = f"""
                    <span>ID: {update.get('messageId', update.get('id', 'Unknown'))}</span>
                    <span style="float: right;">Published: {published_date}</span>
                    """
                    
                    create_card(
                        title=update.get('title', 'Untitled Update'),
                        content=content,
                        footer=footer,
                        accent_color=accent_color
                    )
        
        if not has_updates:
            create_card(
                title="No new announcements",
                content="No message center announcements found for the selected time period.",
                accent_color="#666666"
            )
        
        html += "</div>"
    
    # Windows Updates
    if 'windows-updates' in setting['update_types']:
        html += f"""
        <div style="margin-bottom: 25px;">
            <h2 style="color: #6E59A5; margin-bottom: 15px;">Windows Updates</h2>
        """
        
        has_updates = False
        
        for tenant_id, tenant_updates in updates_data['windows_updates'].items():
            if isinstance(tenant_updates, list) and tenant_updates:
                has_updates = True
                
                for update in tenant_updates:
                    try:
                        start_date = datetime.fromisoformat(update.get('startDate', '')).strftime('%b %d, %Y')
                    except (ValueError, TypeError):
                        start_date = update.get('startDate', 'Unknown Date')
                    
                    # Sanitize product name and status
                    product_name = sanitizeHtml(update.get('productName', 'Unknown Product'))
                    status = sanitizeHtml(update.get('status', 'Unknown Status'))
                    
                    # Sanitize description
                    description = sanitizeHtml(update.get('description', 'No description available.'))
                    description = description[:250] + ('...' if len(description) > 250 else '')
                    
                    content = f"""
                    <div style="margin-bottom: 10px;">
                        <span style="{badge_style} {product_style}">{product_name}</span>
                        <span style="{badge_style} {status_style}">{status}</span>
                    </div>
                    <div style="margin-bottom: 10px; color: #333333; line-height: 1.4;">
                        {description}
                    </div>
                    """
                    
                    footer = f"<span style=\"float: right;\">Release date: {start_date}</span>"
                    
                    create_card(
                        title=update.get('title', 'Untitled Update'),
                        content=content,
                        footer=footer,
                        accent_color="#D946EF"  # Magenta
                    )
        
        if not has_updates:
            create_card(
                title="No new updates",
                content="No Windows updates found for the selected time period.",
                accent_color="#666666"
            )
        
        html += "</div>"
    
    # M365 News
    if 'news' in setting['update_types']:
        html += f"""
        <div style="margin-bottom: 25px;">
            <h2 style="color: #6E59A5; margin-bottom: 15px;">Microsoft 365 News</h2>
        """
        
        has_updates = False
        
        for tenant_id, tenant_news in updates_data['m365_news'].items():
            if isinstance(tenant_news, list) and tenant_news:
                has_updates = True
                
                for item in tenant_news:
                    try:
                        published_date = datetime.fromisoformat(item.get('published_date', '')).strftime('%b %d, %Y')
                    except (ValueError, TypeError):
                        published_date = item.get('published_date', 'Unknown Date')
                    
                    categories = ensureArray(item.get('categories', []))
                    category_badges = ""
                    
                    for category in categories[:3]:  # Limit to first 3 categories
                        sanitized_category = sanitizeHtml(category)
                        category_badges += f'<span style="{badge_style} {informational_style}">{sanitized_category}</span> '
                    
                    # Sanitize summary and title
                    summary = sanitizeHtml(item.get('summary', 'No summary available.'))
                    summary = summary[:250] + ('...' if len(summary) > 250 else '')
                    
                    # Ensure link is properly formatted and safe
                    link = item.get('link', '#')
                    if not link.startswith(('http://', 'https://')):
                        link = '#'  # Default to hash if not a valid URL
                    
                    content = f"""
                    <div style="margin-bottom: 10px;">
                        {category_badges}
                    </div>
                    <div style="margin-bottom: 10px; color: #333333; line-height: 1.4;">
                        {summary}
                    </div>
                    <div>
                        <a href="{link}" 
                           style="color: #6E59A5; text-decoration: none; font-weight: 500;">
                           Read more →
                        </a>
                    </div>
                    """
                    
                    footer = f"<span style=\"float: right;\">Published: {published_date}</span>"
                    
                    create_card(
                        title=item.get('title', 'Untitled News'),
                        content=content,
                        footer=footer,
                        accent_color="#F97316"  # Orange
                    )
        
        if not has_updates:
            create_card(
                title="No recent news",
                content="No Microsoft 365 news found for the selected time period.",
                accent_color="#666666"
            )
        
        html += "</div>"
    
    # Footer
    html += f"""
            <div style="margin-top: 30px; padding: 15px; text-align: center; color: #666666; font-size: 0.8em;">
                <p>This email was sent as part of your Microsoft 365 notification settings</p>
                <p>Update frequency: {frequency} • Generated on {current_date}</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return html
