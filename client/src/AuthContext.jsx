import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("AuthContext: Setting up auth listener...");

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("AuthContext: Auth state changed. New session:", session);
      setSession(session);
      setProfile(null);

      try {
        if (session) {
          console.log("AuthContext: User logged in, fetching profile...");
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (error) {
            console.error(
              "AuthContext: Error fetching profile:",
              error.message
            );
          } else {
            console.log("AuthContext: Profile fetched:", data);
            setProfile(data);
          }
        }
      } catch (e) {
        console.error("AuthContext: A fatal error occurred:", e.message);
      } finally {
        console.log("AuthContext: Setting loading to false.");
        setLoading(false);
      }
    });

    return () => {
      console.log("AuthContext: Cleaning up auth listener.");
      subscription?.unsubscribe();
    };
  }, []);
  const value = {
    session,
    user: session?.user || null,
    profile,
    loading,
    signOut: () => supabase.auth.signOut(),
  };

  console.log("AuthContext: Rendering. Loading state is:", loading);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  return useContext(AuthContext);
};
