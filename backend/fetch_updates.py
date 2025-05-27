
import requests
import json
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
    get_access_token, get_tenant_details
)
from app.database import get_tenant_table_connection, ensure_tenant_tables_exist, get_table_manager

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
    
    # Initialize tenant database
    db_result = initialize_tenant_database(tenant)
    if not db_result:
        print(f"Failed to initialize database for tenant: {tenant_name}")
        return False
    
    # Fix existing table column size if needed
    try:
        table_manager = get_table_manager()
        table_manager.update_existing_table_column(tenant_name, "updates")
        print(f"Updated table column sizes for tenant: {tenant_name}")
    except Exception as e:
        print(f"Warning: Could not update table columns for {tenant_name}: {e}")
        # Continue anyway as the table might already be correct
    
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

        def insert_update(data, tenant_id):
            """Inserts or updates data into Azure SQL updates table for the specified tenant."""
            # Get connection and table name for updates
            conn, updates_table = get_tenant_table_connection(tenant_id, 'updates', 'm365')
            
            if not conn or not updates_table:
                print(f"Failed to get database connection for tenant {tenant_id}")
                return
            
            cursor = conn.cursor()

            # Transform isMajorChange to "MajorChange" or "Not MajorChange"
            is_major_change = "MajorChange" if data.get("isMajorChange", False) else "Not MajorChange"

            try:
                cursor.execute(f"""
                    MERGE {updates_table} AS target
                    USING (VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)) AS source (
                        id, title, category, severity, startDateTime, lastModifiedDateTime, 
                        isMajorChange, actionRequiredByDateTime, services, hasAttachments, 
                        roadmapId, platform, status, lastUpdateTime, bodyContent, tags
                    )
                    ON target.id = source.id
                    WHEN MATCHED THEN
                        UPDATE SET 
                            title = source.title,
                            category = source.category,
                            severity = source.severity,
                            startDateTime = source.startDateTime,
                            lastModifiedDateTime = source.lastModifiedDateTime,
                            isMajorChange = source.isMajorChange,
                            actionRequiredByDateTime = source.actionRequiredByDateTime,
                            services = source.services,
                            hasAttachments = source.hasAttachments,
                            roadmapId = source.roadmapId,
                            platform = source.platform,
                            status = source.status,
                            lastUpdateTime = source.lastUpdateTime,
                            bodyContent = source.bodyContent,
                            tags = source.tags
                    WHEN NOT MATCHED THEN
                        INSERT (id, title, category, severity, startDateTime, lastModifiedDateTime, 
                                isMajorChange, actionRequiredByDateTime, services, hasAttachments, 
                                roadmapId, platform, status, lastUpdateTime, bodyContent, tags)
                        VALUES (source.id, source.title, source.category, source.severity, 
                                source.startDateTime, source.lastModifiedDateTime, source.isMajorChange, 
                                source.actionRequiredByDateTime, source.services, source.hasAttachments, 
                                source.roadmapId, source.platform, source.status, source.lastUpdateTime, 
                                source.bodyContent, source.tags);
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
            except Exception as e:
                print(f"Error inserting update: {e}")
                conn.rollback()
            finally:
                cursor.close()
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

                                # Store each platform-status combination in the tenant database
                                insert_update(announcement_data, tenant["id"])
                    except json.JSONDecodeError:
                        print(f"Error decoding FeatureStatusJson for message ID: {message.get('id', 'N/A')}")
                        # Insert the message anyway without the feature status data
                        insert_update(announcement_data, tenant["id"])

            # Insert the base message even if FeatureStatusJson is missing
            if not any(detail["name"] == "FeatureStatusJson" for detail in message.get("details", [])):
                insert_update(announcement_data, tenant["id"])

        print(f"Completed processing for tenant: {tenant_name}")
        return True

    except Exception as e:
        print(f"Error processing tenant {tenant_name}: {e}")
        return False

def main():
    # Process specific tenant if provided as argument
    if len(sys.argv) > 1:
        tenant_id = sys.argv[1]
        tenant = get_tenant_details(tenant_id)
        
        if tenant:
            print(f"Processing single tenant: {tenant['name']}")
            # Ensure tables exist before fetching data
            ensure_tenant_tables_exist(tenant_id, 'm365')
            fetch_data_for_tenant(tenant)
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
            # Ensure tables exist before fetching data
            ensure_tenant_tables_exist(tenant['id'], 'm365')
            fetch_data_for_tenant(tenant)

if __name__ == "__main__":
    main()
