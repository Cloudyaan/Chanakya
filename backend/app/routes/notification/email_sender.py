
import os
import requests
import msal

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
