import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface DoctorProfile {
  id: string;
  license_number: string;
  specialization: string;
  hospital: string;
  doctor_status: string;
  profiles: {
    id: string;
    role: string;
  };
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
      .select("*")
      .eq("role", "doctor")
      .eq("doctor_status", "pending");

    if (data) setDoctorRequests(data as any);
  };

  const fetchSessions = async () => {
    const { data } = await supabase
      .from("sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) setSessions(data as any);
  };

  useEffect(() => {
    if (!authorized) return;

    fetchDoctorRequests();
    fetchSessions();
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

  if (loading) return null;
  if (!authorized) return null;

  /* ===============================
     UI
  ================================ */

  return (
    <div className="min-h-screen bg-background p-6 space-y-8">

      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {/* Doctor Approval Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Pending Doctor Approvals</h2>

        {doctorRequests.length === 0 && (
          <p className="text-muted-foreground">No pending approvals.</p>
        )}

        {doctorRequests.map((doc) => (
          <motion.div key={doc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="mb-4">
              <CardContent className="p-4 space-y-2">
                <p><strong>Doctor ID:</strong> {doc.id}</p>
                <p><strong>License:</strong> {doc.license_number}</p>
                <p><strong>Specialization:</strong> {doc.specialization}</p>
                <p><strong>Hospital:</strong> {doc.hospital}</p>

                <Button onClick={() => approveDoctor(doc.id)}>
                  Approve Doctor
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Session Monitoring Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Sessions</h2>

        {sessions.map((session) => (
          <Card key={session.id} className="mb-3">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="font-semibold">{session.user_name}</p>
                <p className="text-sm text-muted-foreground">
                  {session.state}
                </p>
              </div>

              <Button onClick={() => navigate(`/report/${session.id}`)}>
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