import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Users, Activity } from "lucide-react";

interface DoctorProfile {
  id: string;
  license_number: string | null;
  specialization: string | null;
  hospital: string | null;
  doctor_status: string | null;
}

interface SessionData {
  id: string;
  user_name: string;
  state: string;
  created_at: string;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [doctorRequests, setDoctorRequests] = useState<DoctorProfile[]>([]);
  const [sessions, setSessions] = useState<SessionData[]>([]);

  /* ===============================
     ROLE CHECK
  ================================ */

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!data || data.role !== "admin") {
        navigate("/");
        return;
      }

      setAuthorized(true);
      setLoading(false);
    };

    checkAdmin();
  }, [user, navigate]);

  /* ===============================
     FETCH DATA
  ================================ */

  const fetchDoctorRequests = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, license_number, specialization, hospital, doctor_status")
      .eq("role", "doctor")
      .eq("doctor_status", "pending");

    if (data) setDoctorRequests(data);
  };

  const fetchSessions = async () => {
    const { data } = await supabase
      .from("sessions")
      .select("id, user_name, state, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) setSessions(data);
  };

  /* ===============================
     REALTIME LISTENERS
  ================================ */

  useEffect(() => {
    if (!authorized) return;

    fetchDoctorRequests();
    fetchSessions();

    const channel = supabase
      .channel("admin_updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        fetchDoctorRequests
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sessions" },
        fetchSessions
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authorized]);

  /* ===============================
     APPROVE DOCTOR
  ================================ */

  const approveDoctor = async (id: string) => {
    await supabase
      .from("profiles")
      .update({ doctor_status: "approved" })
      .eq("id", id);

    fetchDoctorRequests();
  };

  /* ===============================
     UI GUARD
  ================================ */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!authorized) return null;

  /* ===============================
     UI
  ================================ */

  return (
    <div className="min-h-screen bg-background p-6 space-y-10">

      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {/* =================================
          DOCTOR APPROVAL SECTION
      ================================= */}

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Pending Doctor Approvals</h2>
          <Badge variant="secondary">{doctorRequests.length}</Badge>
        </div>

        {doctorRequests.length === 0 && (
          <p className="text-muted-foreground">No pending approvals.</p>
        )}

        {doctorRequests.map((doc) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="mb-4 hover:shadow-lg transition-all">
              <CardContent className="p-5 space-y-3">

                <div className="space-y-1">
                  <p><strong>Doctor ID:</strong> {doc.id}</p>
                  <p><strong>License:</strong> {doc.license_number || "—"}</p>
                  <p><strong>Specialization:</strong> {doc.specialization || "—"}</p>
                  <p><strong>Hospital:</strong> {doc.hospital || "—"}</p>
                </div>

                <Button onClick={() => approveDoctor(doc.id)}>
                  Approve Doctor
                </Button>

              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* =================================
          SESSION MONITORING SECTION
      ================================= */}

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Recent Sessions</h2>
        </div>

        {sessions.map((session) => (
          <Card key={session.id} className="mb-3 hover:border-primary/40 transition-colors">
            <CardContent className="p-4 flex justify-between items-center">

              <div>
                <p className="font-semibold">{session.user_name}</p>
                <Badge variant="outline" className="mt-1">
                  {session.state}
                </Badge>
              </div>

              <Button
                variant="secondary"
                onClick={() => navigate(`/report/${session.id}`)}
              >
                View
              </Button>

            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
};

export default AdminDashboard;