import { useEffect, useState } from "react";
import axios from "axios";
import { Navigate } from "react-router-dom";
import { BACKEND_URL } from "../config";

export default function AuthRedirect() {
  const [status, setStatus] = useState<"loading" | "auth" | "guest">("loading");

  useEffect(() => {
    const check = async () => {
      try {
        await axios.get(BACKEND_URL + "api/v1/users/profile", {
          withCredentials: true,
        });
        setStatus("auth");
      } catch {
        setStatus("guest");
      }
    };

    check();
  }, []);

  if (status === "loading") return null;

  return status === "auth"
    ? <Navigate to="/dashboard" replace />
    : <Navigate to="/signin" replace />;
}
