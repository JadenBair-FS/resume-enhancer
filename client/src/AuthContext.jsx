import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    console.log("AuthContext: Setting up auth listener...");
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        console.log("AuthContext: Auth state changed. New session:", session);
        setSession(session);
        setLoading(false);
      }
    });

    return () => {
      console.log("AuthContext: Cleaning up auth listener.");
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user: session?.user || null,
    loading,
    signOut: () => supabase.auth.signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  return useContext(AuthContext);
};
