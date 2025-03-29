
import { toast } from "@/hooks/use-toast";

export async function getWindowsUpdates(tenantId: string) {
  console.log(`Fetching Windows updates from: ${process.env.API_URL}/windows-updates?tenantId=${tenantId}`);
  try {
    const response = await fetch(`${process.env.API_URL}/windows-updates?tenantId=${tenantId}`);
    if (!response.ok) {
      throw new Error(`Error fetching Windows updates: ${response.status}`);
    }
    const data = await response.json();
    console.log(`Received ${data.length} Windows updates for tenant ID: ${tenantId}`);
    return data;
  } catch (error) {
    console.error("Error fetching Windows updates:", error);
    return [];
  }
}

export async function fetchWindowsUpdates(tenantId: string) {
  try {
    const response = await fetch(`${process.env.API_URL}/fetch-windows-updates`, {
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
        description: "Windows updates fetch initiated successfully",
      });
      return true;
    } else {
      toast({
        title: "Error",
        description: result.message || "Failed to initiate Windows updates fetch",
        variant: "destructive",
      });
      return false;
    }
  } catch (error) {
    console.error("Error fetching Windows updates:", error);
    toast({
      title: "Error",
      description: "Failed to connect to the server",
      variant: "destructive",
    });
    return false;
  }
}
