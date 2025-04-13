import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Function to get the device ID from local storage
function getDeviceId(): string {
  // Try to get the device ID from local storage
  let deviceId = localStorage.getItem('ecosense_device_id');
  
  // If no device ID exists, generate a new one and store it
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('ecosense_device_id', deviceId);
  }
  
  return deviceId;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: { headers?: Record<string, string> }
): Promise<Response> {
  // Get device ID
  const deviceId = getDeviceId();
  
  // Merge headers from options with default headers
  const headers: Record<string, string> = {
    ...(data ? { "Content-Type": "application/json" } : {}),
    "x-device-id": deviceId, // Always include device ID
    ...(options?.headers || {})
  };
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }: { queryKey: string[] }) => {
    // Get device ID
    const deviceId = getDeviceId();
    
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers: {
        "x-device-id": deviceId // Include device ID in all queries
      }
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
