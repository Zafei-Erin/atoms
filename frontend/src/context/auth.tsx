import { createContext } from "react";
import { authClient } from "../lib/auth-client";

type AuthSession = typeof authClient.$Infer.Session;

interface AuthContextValue {
  user: AuthSession["user"] | null;
  session: AuthSession["session"] | null;
  isPending: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  isPending: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data, isPending } = authClient.useSession();

  return (
    <AuthContext.Provider
      value={{
        user: data?.user ?? null,
        session: data?.session ?? null,
        isPending,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
