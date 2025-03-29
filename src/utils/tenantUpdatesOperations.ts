
import { TenantUpdate } from './types';
import { toast } from "@/hooks/use-toast";

export async function getTenantUpdates(tenantId: string): Promise<TenantUpdate[]> {
  console.log(`Fetching tenant updates from: ${process.env.API_URL}/tenant-updates?tenantId=${tenantId}`);
  try {
    const response = await fetch(`${process.env.API_URL}/tenant-updates?tenantId=${tenantId}`);
    if (!response.ok) {
      throw new Error(`Error fetching tenant updates: ${response.status}`);
    }
    const data = await response.json();
    console.log(`Received ${data.length} tenant updates for tenant ID: ${tenantId}`);
    return data;
  } catch (error) {
    console.error("Error fetching tenant updates:", error);
    return [];
  }
}

export async function fetchTenantUpdates(tenantId: string): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.API_URL}/fetch-tenant-updates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tenantId }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      toast({
        title: "Success",
        description: "Tenant updates fetch initiated successfully",
      });
      return true;
    } else {
      toast({
        title: "Error",
        description: result.message || "Failed to initiate tenant updates fetch",
        variant: "destructive",
      });
      return false;
    }
  } catch (error) {
    console.error("Error fetching tenant updates:", error);
    toast({
      title: "Error",
      description: "Failed to connect to the server",
      variant: "destructive",
    });
    return false;
  }
}
