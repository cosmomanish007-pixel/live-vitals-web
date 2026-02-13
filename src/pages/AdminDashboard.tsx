import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Users, Activity, ShieldCheck, AlertTriangle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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
  risk_level?: string;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  const [doctorRequests, setDoctorRequests] = useState<DoctorProfile[]>([]);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [allDoctors, setAllDoctors] = useState<number>(0);

  const [search, setSearch] = useState("");
  const [activityLog, setActivityLog] = useState<string[]>([]);

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
  }, [user]);

  /* ===============================
     FETCH DATA
  ================================ */

  const fetchData = async () => {
    const { data: pending } = await supabase
      .from("profiles")
      .select("id, license_number, specialization, hospital, doctor_status")
      .eq("role", "doctor")
      .eq("doctor_status", "pending");

    const { data: sessionData } = await supabase
      .from("sessions")
      .select("id, user_name, state, created_at")
      .order("created_at", { ascending: false });

    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "doctor");

    if (pending) setDoctorRequests(pending);
    if (sessionData) setSessions(sessionData);
    if (count) setAllDoctors(count);
  };

  useEffect(() => {
    if (!authorized) return;
    fetchData();
  }, [authorized]);

  /* ===============================
     APPROVE / REJECT
  ================================ */

  const approveDoctor = async (id: string) => {
    await supabase
      .from("profiles")
      .update({ doctor_status: "approved" })
      .eq("id", id);

    setActivityLog((prev) => [
      `Doctor ${id} approved`,
      ...prev,
    ]);

    fetchData();
  };

  const rejectDoctor = async (id: string) => {
    await supabase
      .from("profiles")
      .update({ doctor_status: "rejected" })
      .eq("id", id);

    setActivityLog((prev) => [
      `Doctor ${id} rejected`,
      ...prev,
    ]);

    fetchData();
  };

  /* ===============================
     SEARCH FILTER
  ================================ */

  const filteredDoctors = useMemo(() => {
    return doctorRequests.filter((doc) =>
      doc.license_number?.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, doctorRequests]);

  /* ===============================
     RISK SUMMARY MOCK (for UI)
  ================================ */

  const riskData = [
    { name: "RED", value: sessions.filter((s) => s.state === "RED").length },
    { name: "YELLOW", value: sessions.filter((s) => s.state === "YELLOW").length },
    { name: "GREEN", value: sessions.filter((s) => s.state === "GREEN").length },
  ];

  /* ===============================
     EXPORT CSV
  ================================ */

  const exportCSV = () => {
    const headers = ["Session ID", "User", "State", "Created"];
    const rows = sessions.map((s) =>
      [s.id, s.user_name, s.state, s.created_at].join(",")
    );

    const blob = new Blob([headers.join(",") + "\n" + rows.join("\n")], {
      type: "text/csv",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sessions.csv";
    a.click();
  };

  if (loading) return null;
  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-background p-8 space-y-10">

      <h1 className="text-3xl font-bold">Admin Control Center</h1>

      {/* ===============================
          STATS CARDS
      ================================ */}

      <div className="grid md:grid-cols-4 gap-6">

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Total Doctors</p>
              <h2 className="text-2xl font-bold">{allDoctors}</h2>
            </div>
            <Users />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Pending Approvals</p>
            <h2 className="text-2xl font-bold text-yellow-500">
              {doctorRequests.length}
            </h2>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Total Sessions</p>
            <h2 className="text-2xl font-bold">{sessions.length}</h2>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">System Status</p>
            <h2 className="text-green-500 font-bold">Operational</h2>
          </CardContent>
        </Card>

      </div>

      {/* ===============================
          DOCTOR APPROVAL SECTION
      ================================ */}

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Doctor Approvals</h2>
          <Input
            placeholder="Search by license..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
        </div>

        {filteredDoctors.map((doc) => (
          <Card key={doc.id} className="mb-4">
            <CardContent className="p-5 flex justify-between items-center">

              <div>
                <Badge variant="outline" className="mb-2">
                  Pending
                </Badge>
                <p><strong>License:</strong> {doc.license_number}</p>
                <p><strong>Specialization:</strong> {doc.specialization}</p>
                <p><strong>Hospital:</strong> {doc.hospital}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => approveDoctor(doc.id)}
                >
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => rejectDoctor(doc.id)}
                >
                  Reject
                </Button>
              </div>

            </CardContent>
          </Card>
        ))}
      </div>

      {/* ===============================
          RISK ANALYTICS
      ================================ */}

      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Risk Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={riskData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ===============================
          RECENT SESSIONS
      ================================ */}

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Sessions</h2>
          <Button onClick={exportCSV}>Export CSV</Button>
        </div>

        {sessions.slice(0, 10).map((session) => (
          <Card key={session.id} className="mb-3">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="font-semibold">{session.user_name}</p>
                <Badge variant="outline">{session.state}</Badge>
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

      {/* ===============================
          ACTIVITY LOG
      ================================ */}

      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Live Activity Feed</h2>
          {activityLog.length === 0 && (
            <p className="text-muted-foreground">No recent activity</p>
          )}
          {activityLog.map((log, index) => (
            <p key={index} className="text-sm mb-2">
              • {log}
            </p>
          ))}
        </CardContent>
      </Card>

    </div>
  );
};

export default AdminDashboard;
