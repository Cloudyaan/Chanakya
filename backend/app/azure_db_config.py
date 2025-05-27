
import os
import pyodbc
import json
from datetime import datetime
from typing import Optional, Dict, Any, List

class AzureSQLConfig:
    """Configuration and connection management for Azure SQL Database."""
    
    def __init__(self):
        # Load connection details from environment variables
        self.server = os.getenv('AZURE_SQL_SERVER')
        self.database = os.getenv('AZURE_SQL_DATABASE')
        self.username = os.getenv('AZURE_SQL_USERNAME')
        self.password = os.getenv('AZURE_SQL_PASSWORD')
        self.driver = os.getenv('AZURE_SQL_DRIVER', '{ODBC Driver 17 for SQL Server}')
        
        if not all([self.server, self.database, self.username, self.password]):
            raise ValueError("Missing required Azure SQL Database environment variables")
    
    def get_connection_string(self):
        """Get the connection string for Azure SQL Database."""
        return (
            f"DRIVER={self.driver};"
            f"SERVER={self.server};"
            f"DATABASE={self.database};"
            f"UID={self.username};"
            f"PWD={self.password};"
            f"Encrypt=yes;"
            f"TrustServerCertificate=no;"
            f"Connection Timeout=30;"
        )
    
    def get_connection(self):
        """Get a connection to Azure SQL Database."""
        try:
            conn = pyodbc.connect(self.get_connection_string())
            return conn
        except Exception as e:
            print(f"Error connecting to Azure SQL Database: {e}")
            raise

class TenantTableManager:
    """Manages tenant-specific tables in Azure SQL Database."""
    
    def __init__(self, azure_config: AzureSQLConfig):
        self.azure_config = azure_config
    
    def get_table_name(self, tenant_name: str, table_type: str) -> str:
        """Generate table name for a tenant and table type."""
        # Sanitize tenant name for use in table names
        safe_name = ''.join(c if c.isalnum() else '_' for c in tenant_name.lower())
        
        if table_type == "updates":
            return f"{safe_name}_m365_updates"
        elif table_type == "m365_news":
            return f"{safe_name}_m365_news"
        elif table_type == "windows_known_issues":
            return f"{safe_name}_m365_win_issues"
        else:
            return f"{safe_name}_m365_{table_type}"
    
    def create_tenant_tables(self, tenant_name: str, tenant_id: str, service_type: str = "m365"):
        """Create necessary tables for a Microsoft 365 tenant."""
        conn = self.azure_config.get_connection()
        cursor = conn.cursor()
        
        try:
            # Create updates table
            updates_table = self.get_table_name(tenant_name, "updates")
            cursor.execute(f"""
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='{updates_table}' AND xtype='U')
                CREATE TABLE {updates_table} (
                    id NVARCHAR(255) PRIMARY KEY,
                    title NVARCHAR(MAX),
                    category NVARCHAR(255),
                    severity NVARCHAR(50),
                    startDateTime NVARCHAR(100) DEFAULT '',
                    lastModifiedDateTime NVARCHAR(100) DEFAULT '',
                    isMajorChange NVARCHAR(10),
                    actionRequiredByDateTime NVARCHAR(100) DEFAULT '',
                    services NVARCHAR(MAX) DEFAULT '',
                    hasAttachments BIT,
                    roadmapId NVARCHAR(255) DEFAULT '',
                    platform NVARCHAR(255) DEFAULT '',
                    status NVARCHAR(255) DEFAULT '',
                    lastUpdateTime NVARCHAR(100) DEFAULT '',
                    bodyContent NVARCHAR(MAX) DEFAULT '',
                    tags NVARCHAR(MAX) DEFAULT ''
                )
            """)
            
            # Create m365_news table
            news_table = self.get_table_name(tenant_name, "m365_news")
            cursor.execute(f"""
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='{news_table}' AND xtype='U')
                CREATE TABLE {news_table} (
                    id NVARCHAR(255) PRIMARY KEY,
                    title NVARCHAR(MAX),
                    published_date NVARCHAR(100),
                    link NVARCHAR(MAX),
                    summary NVARCHAR(MAX),
                    categories NVARCHAR(MAX),
                    fetch_date NVARCHAR(100)
                )
            """)
            
            # Create windows_known_issues table
            issues_table = self.get_table_name(tenant_name, "windows_known_issues")
            cursor.execute(f"""
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='{issues_table}' AND xtype='U')
                CREATE TABLE {issues_table} (
                    id NVARCHAR(255) PRIMARY KEY,
                    product_id NVARCHAR(255),
                    title NVARCHAR(MAX),
                    description NVARCHAR(MAX),
                    status NVARCHAR(255),
                    start_date NVARCHAR(100),
                    resolved_date NVARCHAR(100),
                    web_view_url NVARCHAR(MAX)
                )
            """)
            
            conn.commit()
            print(f"Successfully created tables for tenant: {tenant_name}")
            
        except Exception as e:
            print(f"Error creating tables for tenant {tenant_name}: {e}")
            conn.rollback()
            raise
        finally:
            cursor.close()
            conn.close()
    
    def drop_tenant_tables(self, tenant_name: str, service_type: str = "m365"):
        """Drop all tables for a tenant."""
        conn = self.azure_config.get_connection()
        cursor = conn.cursor()
        
        try:
            # Drop the three main tables
            tables = [
                self.get_table_name(tenant_name, "windows_known_issues"),
                self.get_table_name(tenant_name, "m365_news"),
                self.get_table_name(tenant_name, "updates")
            ]
            
            for table in tables:
                cursor.execute(f"IF EXISTS (SELECT * FROM sysobjects WHERE name='{table}' AND xtype='U') DROP TABLE {table}")
            
            conn.commit()
            print(f"Successfully dropped tables for tenant: {tenant_name}")
            
        except Exception as e:
            print(f"Error dropping tables for tenant {tenant_name}: {e}")
            conn.rollback()
            raise
        finally:
            cursor.close()
            conn.close()
    
    def get_tenant_table_name(self, tenant_name: str, table_name: str, service_type: str = "m365") -> str:
        """Get the full table name for a tenant and table."""
        return self.get_table_name(tenant_name, table_name)
