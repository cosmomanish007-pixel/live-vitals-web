import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

interface RoleRouteProps {
  allowedRole: string;
  children: React.ReactNode;
}

export const RoleRoute = ({ allowedRole, children }: RoleRouteProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (data?.role === allowedRole) {
        setAuthorized(true);
      }

      setLoading(false);
    };

    checkRole();
  }, [user, allowedRole]);

  if (loading) return null;

  if (!authorized) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};