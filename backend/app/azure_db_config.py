
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
            # Enable row access by column name
            conn.row_factory = pyodbc.Row
            return conn
        except Exception as e:
            print(f"Error connecting to Azure SQL Database: {e}")
            raise

class TenantTableManager:
    """Manages tenant-specific tables in Azure SQL Database."""
    
    def __init__(self, azure_config: AzureSQLConfig):
        self.azure_config = azure_config
    
    def get_table_prefix(self, tenant_name: str, service_type: str = "m365") -> str:
        """Generate table prefix for a tenant."""
        # Sanitize tenant name for use in table names
        safe_name = ''.join(c if c.isalnum() else '_' for c in tenant_name.lower())
        return f"{safe_name}_{service_type}_"
    
    def create_tenant_tables(self, tenant_name: str, tenant_id: str, service_type: str = "m365"):
        """Create all necessary tables for a tenant."""
        conn = self.azure_config.get_connection()
        cursor = conn.cursor()
        
        table_prefix = self.get_table_prefix(tenant_name, service_type)
        
        try:
            # Create updates table
            cursor.execute(f"""
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='{table_prefix}updates' AND xtype='U')
                CREATE TABLE {table_prefix}updates (
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
            
            # Create licenses table
            cursor.execute(f"""
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='{table_prefix}licenses' AND xtype='U')
                CREATE TABLE {table_prefix}licenses (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    license_sku NVARCHAR(255),
                    display_name NVARCHAR(255),
                    type NVARCHAR(100),
                    total_licenses INT,
                    used_licenses INT,
                    unused_licenses INT,
                    renewal_expiration_date NVARCHAR(100),
                    captured_date NVARCHAR(100)
                )
            """)
            
            # Create inactive_users table
            cursor.execute(f"""
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='{table_prefix}inactive_users' AND xtype='U')
                CREATE TABLE {table_prefix}inactive_users (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    user_principal_name NVARCHAR(255),
                    display_name NVARCHAR(255),
                    account_enabled BIT,
                    last_sign_in_attempt NVARCHAR(100),
                    last_successful_sign_in NVARCHAR(100),
                    captured_date NVARCHAR(100)
                )
            """)
            
            # Create over_licensed_users table
            cursor.execute(f"""
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='{table_prefix}over_licensed_users' AND xtype='U')
                CREATE TABLE {table_prefix}over_licensed_users (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    display_name NVARCHAR(255),
                    user_principal_name NVARCHAR(255),
                    licenses NVARCHAR(MAX),
                    captured_date NVARCHAR(100)
                )
            """)
            
            # Create m365_news table
            cursor.execute(f"""
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='{table_prefix}m365_news' AND xtype='U')
                CREATE TABLE {table_prefix}m365_news (
                    id NVARCHAR(255) PRIMARY KEY,
                    title NVARCHAR(MAX),
                    published_date NVARCHAR(100),
                    link NVARCHAR(MAX),
                    summary NVARCHAR(MAX),
                    categories NVARCHAR(MAX),
                    fetch_date NVARCHAR(100)
                )
            """)
            
            # Create windows_products table
            cursor.execute(f"""
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='{table_prefix}windows_products' AND xtype='U')
                CREATE TABLE {table_prefix}windows_products (
                    id NVARCHAR(255) PRIMARY KEY,
                    name NVARCHAR(255),
                    group_name NVARCHAR(255),
                    friendly_names NVARCHAR(MAX)
                )
            """)
            
            # Create windows_known_issues table
            cursor.execute(f"""
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='{table_prefix}windows_known_issues' AND xtype='U')
                CREATE TABLE {table_prefix}windows_known_issues (
                    id NVARCHAR(255) PRIMARY KEY,
                    product_id NVARCHAR(255),
                    title NVARCHAR(MAX),
                    description NVARCHAR(MAX),
                    status NVARCHAR(255),
                    start_date NVARCHAR(100),
                    resolved_date NVARCHAR(100),
                    web_view_url NVARCHAR(MAX),
                    FOREIGN KEY (product_id) REFERENCES {table_prefix}windows_products (id)
                )
            """)
            
            conn.commit()
            print(f"Successfully created tables for tenant: {tenant_name} with prefix: {table_prefix}")
            
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
        
        table_prefix = self.get_table_prefix(tenant_name, service_type)
        
        try:
            # Drop tables in reverse order due to foreign key constraints
            tables = [
                f"{table_prefix}windows_known_issues",
                f"{table_prefix}windows_products",
                f"{table_prefix}m365_news",
                f"{table_prefix}over_licensed_users",
                f"{table_prefix}inactive_users",
                f"{table_prefix}licenses",
                f"{table_prefix}updates"
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
        table_prefix = self.get_table_prefix(tenant_name, service_type)
        return f"{table_prefix}{table_name}"
