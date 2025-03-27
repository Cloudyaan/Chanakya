
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

def get_tenant_db_connection():
    """Get a connection to the tenant configuration database."""
    conn = sqlite3.connect('chanakya.db')
    conn.row_factory = sqlite3.Row  # Return rows as dictionaries
    return conn

def fetch_tenants():
    """Fetch all tenants from the tenant configuration database."""
    conn = get_tenant_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tenants")
    tenants = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return tenants

def fetch_data_for_tenant(tenant):
    """Fetch data for a specific tenant using their credentials."""
    CLIENT_ID = tenant["applicationId"]
    TENANT_ID = tenant["tenantId"]
    CLIENT_SECRET = tenant["applicationSecret"]
    TENANT_NAME = tenant["name"]

    print(f"Processing tenant: {TENANT_NAME} (ID: {TENANT_ID})")
    
    AUTHORITY = f"https://login.microsoftonline.com/{TENANT_ID}"
    ENDPOINT = "https://graph.microsoft.com/beta/admin/serviceAnnouncement/messages?$top=1000"

    try:
        # Create MSAL client application
        app = msal.ConfidentialClientApplication(
            CLIENT_ID, authority=AUTHORITY, client_credential=CLIENT_SECRET
        )

        # Acquire an access token
        result = app.acquire_token_silent(["https://graph.microsoft.com/.default"], account=None)
        if not result:
            print("Fetching new token...")
            result = app.acquire_token_for_client(scopes=["https://graph.microsoft.com/.default"])

        if "access_token" not in result:
            print(f"Error: {result.get('error')}")
            print(f"Error description: {result.get('error_description')}")
            return

        headers = {
            "Authorization": f"Bearer {result['access_token']}",
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

        # SQLite Database Setup for Tenant-Specific Data
        TENANT_ANNOUNCEMENTS_DB_NAME = f"service_announcements_{TENANT_ID}.db"

        def setup_database():
            """Creates the database and table if it doesn't exist."""
            print(f"Setting up database for tenant {TENANT_ID}...")
            conn = sqlite3.connect(TENANT_ANNOUNCEMENTS_DB_NAME)
            cursor = conn.cursor()

            # Drop the existing table if it exists
            cursor.execute("DROP TABLE IF EXISTS announcements")
            print("Dropped existing table (if any).")

            # Create the table with the schema
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS announcements (
                    id TEXT PRIMARY KEY,
                    title TEXT,
                    category TEXT,
                    severity TEXT,
                    startDateTime TEXT DEFAULT '',
                    lastModifiedDateTime TEXT DEFAULT '',
                    isMajorChange TEXT,
                    actionRequiredByDateTime TEXT DEFAULT '',
                    services TEXT DEFAULT '',
                    hasAttachments BOOLEAN,
                    roadmapId TEXT DEFAULT '',
                    platform TEXT DEFAULT '',
                    status TEXT DEFAULT '',
                    lastUpdateTime TEXT DEFAULT '',
                    bodyContent TEXT DEFAULT '',
                    tags TEXT DEFAULT ''
                )
            """)
            print("Created new table with schema.")
            conn.commit()
            conn.close()
            print("Database setup complete.")

        def insert_announcement(data):
            """Inserts or updates announcement data into SQLite."""
            conn = sqlite3.connect(TENANT_ANNOUNCEMENTS_DB_NAME)
            cursor = conn.cursor()

            # Transform isMajorChange to "MajorChange" or "Not MajorChange"
            is_major_change = "MajorChange" if data.get("isMajorChange", False) else "Not MajorChange"

            cursor.execute("""
                INSERT OR REPLACE INTO announcements (
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
        setup_database()
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
                                insert_announcement(announcement_data)
                    except json.JSONDecodeError:
                        print(f"Error decoding FeatureStatusJson for message ID: {message.get('id', 'N/A')}")
                        # Insert the message anyway without the feature status data
                        insert_announcement(announcement_data)

            # Insert the base message even if FeatureStatusJson is missing
            if not any(detail["name"] == "FeatureStatusJson" for detail in message.get("details", [])):
                insert_announcement(announcement_data)

        print(f"Completed processing for tenant: {TENANT_NAME}")

    except Exception as e:
        print(f"Error processing tenant {TENANT_NAME}: {e}")

def main():
    # Process specific tenant if provided as argument
    if len(sys.argv) > 1:
        tenant_id = sys.argv[1]
        conn = get_tenant_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tenants WHERE id = ?", (tenant_id,))
        tenant = cursor.fetchone()
        conn.close()
        
        if tenant:
            print(f"Processing single tenant: {tenant['name']}")
            fetch_data_for_tenant(dict(tenant))
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
