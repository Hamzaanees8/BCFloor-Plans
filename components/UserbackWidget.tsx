"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@/context/UserContext";

/**
 * UserbackWidget Component
 * 
 * Integrates the Userback feedback widget into the BCF Admin portal.
 * It dynamically imports the `@userback/widget` package on the client-side
 * to prevent SSR conflicts and binds the logged-in user's identity to
 * any feedback submitted.
 */
export default function UserbackWidget() {
  const { user } = useUser();
  const userbackInstance = useRef<any>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    const token = process.env.NEXT_PUBLIC_USERBACK_TOKEN || "P-IChGiDQFSrPPqe0zSf1RV9ve5";

    const initUserback = async () => {
      try {
        // Dynamically import to ensure client-only execution and avoid SSR build-time errors
        const Userback = (await import("@userback/widget")).default;
        
        const instance = await Userback(token, {
          user_data: user ? {
            info: {
              name: user.name || `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Authenticated User",
              email: user.email || "",
            }
          } : undefined
        });

        userbackInstance.current = instance;
      } catch (error) {
        console.error("Failed to load or initialize Userback widget:", error);
      }
    };

    initUserback();

    return () => {
      if (userbackInstance.current) {
        try {
          userbackInstance.current.destroy();
        } catch (e) {
          console.error("Error destroying Userback instance:", e);
        }
        userbackInstance.current = null;
      }
    };
  }, [user]);

  // Update user identity dynamically when user info changes
  useEffect(() => {
    if (userbackInstance.current && user) {
      try {
        userbackInstance.current.setData({
          user_data: {
            info: {
              name: user.name || `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Authenticated User",
              email: user.email || "",
            }
          }
        });
      } catch (error) {
        console.error("Failed to update Userback user data:", error);
      }
    }
  }, [user]);

  return null;
}
