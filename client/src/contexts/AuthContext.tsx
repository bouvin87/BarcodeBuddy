import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  sessionId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [sessionId, setSessionId] = useState<string | null>(
    localStorage.getItem("sessionId")
  );
  const queryClient = useQueryClient();

  // Check auth status
  const { data: authStatus, isLoading } = useQuery({
    queryKey: ["auth-status", sessionId],
    queryFn: async () => {
      if (!sessionId) return { authenticated: false };
      
      const response = await fetch("/api/auth/status", {
        headers: sessionId ? { Authorization: `Bearer ${sessionId}` } : {},
      });
      
      if (!response.ok) {
        // Clear invalid session
        setSessionId(null);
        localStorage.removeItem("sessionId");
        return { authenticated: false };
      }
      
      return response.json();
    },
    retry: false,
    enabled: !!sessionId, // Only run when we have a sessionId
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", { username, password });
      return response.json();
    },
    onSuccess: (data: any) => {
      setSessionId(data.sessionId);
      localStorage.setItem("sessionId", data.sessionId);
      // Don't invalidate immediately - let the natural query refetch handle it
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (sessionId) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${sessionId}` },
        });
      }
    },
    onSuccess: () => {
      setSessionId(null);
      localStorage.removeItem("sessionId");
      queryClient.clear();
    },
  });

  // Set Authorization header for all requests
  useEffect(() => {
    if (sessionId) {
      // Update default headers for future requests
      const originalFetch = window.fetch;
      window.fetch = (url, options = {}) => {
        return originalFetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${sessionId}`,
          },
        });
      };

      // Cleanup function to restore original fetch
      return () => {
        window.fetch = originalFetch;
      };
    }
  }, [sessionId]);

  const login = async (username: string, password: string) => {
    await loginMutation.mutateAsync({ username, password });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const contextValue: AuthContextType = {
    isAuthenticated: authStatus?.authenticated ?? false,
    isLoading,
    login,
    logout,
    sessionId,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}