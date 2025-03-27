
import requests
import json
import sqlite3
import sys
import os

try:
    import msal
except ImportError:
    print("Error: MSAL package is not installed.")
    print("Please install it using: pip install msal")
    sys.exit(1)

from tenant_db_manager import (
    fetch_tenants, initialize_tenant_database, 
    get_access_token, get_tenant_database_path
)

def fetch_data_for_tenant(tenant):
    """Fetch data for a specific tenant using their credentials."""
    tenant_name = tenant["name"]
    tenant_id = tenant["tenantId"]

    print(f"Processing tenant: {tenant_name} (ID: {tenant_id})")
    
    # Get access token
    token = get_access_token(tenant)
    if not token:
        print(f"Failed to get access token for tenant: {tenant_name}")
        return False
    
    # Initialize the tenant database
    db_path = initialize_tenant_database(tenant)
    
    # Endpoint for message center announcements
    ENDPOINT = "https://graph.microsoft.com/beta/admin/serviceAnnouncement/messages?$top=1000"

    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Prefer": "odata.maxpagesize=1000"
        }

        # Fetch messages with pagination
        def fetch_all_messages():
            """Fetch all messages from Microsoft Graph API using pagination."""
            messages = []
            url = ENDPOINT

            while url:
                try:
                    print(f"Fetching from: {url}")
                    response = requests.get(url, headers=headers)
                    response.raise_for_status()
                    data = response.json()

                    # Append messages from this page
                    messages.extend(data.get("value", []))
                    print(f"Retrieved {len(data.get('value', []))} messages")

                    # Check for pagination
                    url = data.get("@odata.nextLink")  # Fetch next page if available
                except requests.exceptions.RequestException as e:
                    print(f"Error fetching messages: {e}")
                    break

            print(f"Total messages retrieved: {len(messages)}")
            return messages

        def insert_update(data):
            """Inserts or updates data into SQLite updates table."""
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()

            # Transform isMajorChange to "MajorChange" or "Not MajorChange"
            is_major_change = "MajorChange" if data.get("isMajorChange", False) else "Not MajorChange"

            cursor.execute("""
                INSERT OR REPLACE INTO updates (
                    id, title, category, severity, startDateTime, lastModifiedDateTime, 
                    isMajorChange, actionRequiredByDateTime, services, hasAttachments, 
                    roadmapId, platform, status, lastUpdateTime, bodyContent, tags
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                data.get("id", ""),
                data.get("title", ""),
                data.get("category", ""),
                data.get("severity", ""),
                data.get("startDateTime", ""),
                data.get("lastModifiedDateTime", ""),
                is_major_change,
                data.get("actionRequiredByDateTime", ""),
                data.get("services", ""),
                data.get("hasAttachments", False),
                data.get("roadmapId", ""),
                data.get("platform", ""),
                data.get("status", ""),
                data.get("lastUpdateTime", ""),
                data.get("bodyContent", ""),
                ", ".join(data.get("tags", [])) if data.get("tags") else ""
            ))

            conn.commit()
            conn.close()

        # Fetch and store messages
        messages = fetch_all_messages()

        for message in messages:
            # Default values for missing fields
            announcement_data = {
                "id": message.get("id", ""),
                "title": message.get("title", ""),
                "category": message.get("category", ""),
                "severity": message.get("severity", ""),
                "startDateTime": message.get("startDateTime", ""),
                "lastModifiedDateTime": message.get("lastModifiedDateTime", ""),
                "isMajorChange": message.get("isMajorChange", False),
                "actionRequiredByDateTime": message.get("actionRequiredByDateTime", ""),
                "services": ", ".join(message.get("services", [])) if message.get("services") else "",
                "hasAttachments": message.get("hasAttachments", False),
                "roadmapId": "",
                "platform": "",
                "status": "",
                "lastUpdateTime": "",
                "bodyContent": message.get("body", {}).get("content", "No content"),
                "tags": message.get("tags", [])
            }

            # Extract additional details if available
            for detail in message.get("details", []):
                if detail["name"] == "RoadmapIds":
                    announcement_data["roadmapId"] = detail["value"]
                if detail["name"] == "FeatureStatusJson":
                    try:
                        feature_status_json = json.loads(detail["value"])
                        for roadmap_id, roadmap_data in feature_status_json.items():
                            for feature in roadmap_data:
                                announcement_data["platform"] = feature.get("Platform", "")
                                announcement_data["status"] = feature.get("Status", "")
                                announcement_data["lastUpdateTime"] = feature.get("LastUpdateTime", "")

                                # Store each platform-status combination
                                insert_update(announcement_data)
                    except json.JSONDecodeError:
                        print(f"Error decoding FeatureStatusJson for message ID: {message.get('id', 'N/A')}")
                        # Insert the message anyway without the feature status data
                        insert_update(announcement_data)

            # Insert the base message even if FeatureStatusJson is missing
            if not any(detail["name"] == "FeatureStatusJson" for detail in message.get("details", [])):
                insert_update(announcement_data)

        print(f"Completed processing for tenant: {tenant_name}")
        return True

    except Exception as e:
        print(f"Error processing tenant {tenant_name}: {e}")
        return False

def main():
    # Process specific tenant if provided as argument
    if len(sys.argv) > 1:
        tenant_id = sys.argv[1]
        tenants = fetch_tenants()
        matching_tenant = next((t for t in tenants if t['id'] == tenant_id), None)
        
        if matching_tenant:
            print(f"Processing single tenant: {matching_tenant['name']}")
            fetch_data_for_tenant(matching_tenant)
        else:
            print(f"No tenant found with ID: {tenant_id}")
    else:
        # Process all tenants
        tenants = fetch_tenants()
        if not tenants:
            print("No tenants found in the database.")
            return
            
        print(f"Found {len(tenants)} tenants to process.")
        for tenant in tenants:
            fetch_data_for_tenant(tenant)

if __name__ == "__main__":
    main()
