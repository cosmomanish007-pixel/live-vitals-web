import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Users,
  Activity,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Stethoscope,
  UserCheck,
  UserX,
  Eye,
  Download,
  RefreshCw,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { motion } from "framer-motion";

/* ===============================
   TYPES
================================= */

interface DoctorProfile {
  id: string;
  full_name: string | null;
  license_number: string | null;
  specialization: string | null;
  hospital: string | null;
  doctor_status: string | null;
  is_available: boolean | null;
  created_at: string;
}

interface SessionData {
  id: string;
  user_name: string;
  state: string;
  risk_level: string | null;
  created_at: string;
}

/* ===============================
   COMPONENT
================================= */

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);

  const [searchDoctor, setSearchDoctor] = useState("");
  const [searchSession, setSearchSession] = useState("");
  const [selectedDoctor, setSelectedDoctor] =
    useState<DoctorProfile | null>(null);
  
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);

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
     FETCH ALL DATA
  ================================ */

  const fetchDoctors = async () => {
    const { data } = await supabase
      .from("profiles")
      .select(
        "id, full_name, license_number, specialization, hospital, doctor_status, is_available, created_at"
      )
      .eq("role", "doctor");

    if (data) setDoctors(data);
  };

  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from("sessions")
      .select(`
        id,
        user_name,
        state,
        created_at,
        consultation_requests (
          risk_level
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Session fetch error:", error);
      return;
    }

    if (data) {
      const formatted = data.map((s: any) => ({
        ...s,
        risk_level:
          s.consultation_requests &&
          s.consultation_requests.length > 0
            ? s.consultation_requests[0].risk_level
            : "GREEN",
      }));

      setSessions(formatted);
    }
  };

  const fetchUsers = async () => {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "user");

    setTotalUsers(count || 0);
  };

  useEffect(() => {
    if (!authorized) return;
    fetchDoctors();
    fetchSessions();
    fetchUsers();
  }, [authorized]);

  /* ===============================
     KPIs
  ================================ */

  const totalDoctors = doctors.length;
  const approvedDoctors = doctors.filter(
    (d) => d.doctor_status === "approved"
  ).length;
  const pendingDoctors = doctors.filter(
    (d) => d.doctor_status === "pending"
  ).length;
  const suspendedDoctors = doctors.filter(
    (d) => d.doctor_status === "suspended"
  ).length;

  const totalSessions = sessions.length;
  const redRisk = sessions.filter((s) => s.risk_level === "RED").length || 0;
  const yellowRisk = sessions.filter((s) => s.risk_level === "YELLOW").length || 0;
  const greenRisk = sessions.filter((s) => s.risk_level === "GREEN").length || 0;

  /* ===============================
     FILTERING
  ================================ */

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) =>
      (doc.full_name || "")
        .toLowerCase()
        .includes(searchDoctor.toLowerCase())
    );
  }, [doctors, searchDoctor]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) =>
      s.user_name.toLowerCase().includes(searchSession.toLowerCase())
    );
  }, [sessions, searchSession]);

  /* ===============================
     ACTIONS
  ================================ */

  const updateDoctorStatus = async (
    id: string,
    status: string
  ) => {
    await supabase
      .from("profiles")
      .update({ doctor_status: status })
      .eq("id", id);

    fetchDoctors();
  };

  const toggleAvailability = async (
    id: string,
    current: boolean | null
  ) => {
    await supabase
      .from("profiles")
      .update({ is_available: !current })
      .eq("id", id);

    fetchDoctors();
  };

  const exportCSV = () => {
    const csvRows = [
      ["Patient", "Risk", "State", "Created"],
      ...sessions.map((s) => [
        s.user_name,
        s.risk_level,
        s.state,
        s.created_at,
      ]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      csvRows.map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sessions.csv");
    document.body.appendChild(link);
    link.click();
  };

  const refreshAll = () => {
    fetchDoctors();
    fetchSessions();
    fetchUsers();
  };

  /* ===============================
     CHART DATA
  ================================ */

  const pieData = [
    { name: "RED", value: redRisk },
    { name: "YELLOW", value: yellowRisk },
    { name: "GREEN", value: greenRisk },
  ];

  const COLORS = ["#ef4444", "#facc15", "#22c55e"];

  /* ===============================
     LOADING
  ================================ */

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="animate-spin" />
      </div>
    );

  if (!authorized) return null;

  /* ===============================
     UI
  ================================ */

  return (
    <div className="min-h-screen bg-background text-foreground p-8 space-y-12">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Control Center</h1>
        <div className="flex gap-3">
          <Button onClick={() => setShowAddDoctor(true)}>
            Add Doctor
          </Button>
          <Button variant="secondary" onClick={() => setShowAddUser(true)}>
            Add User
          </Button>
          <Button onClick={refreshAll}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid lg:grid-cols-4 gap-6">

        <KPI label="Total Users" value={totalUsers} icon={<Users />} />
        <KPI label="Total Doctors" value={totalDoctors} icon={<Stethoscope />} />
        <KPI label="Approved" value={approvedDoctors} icon={<UserCheck />} color="text-green-500" />
        <KPI label="Pending" value={pendingDoctors} icon={<AlertTriangle />} color="text-yellow-500" />
        
        <KPI label="Suspended" value={suspendedDoctors} icon={<UserX />} color="text-red-500" />
        <KPI label="Total Sessions" value={totalSessions} icon={<Activity />} />
        <KPI label="High Risk" value={redRisk} icon={<AlertTriangle />} color="text-red-500" />
        <KPI label="Moderate Risk" value={yellowRisk} icon={<TrendingUp />} color="text-yellow-500" />
        
        <KPI label="Stable" value={greenRisk} icon={<ShieldCheck />} color="text-green-500" />

      </div>

      {/* RISK CHART */}
      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold mb-4">Risk Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} dataKey="value" outerRadius={110}>
                {pieData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* DOCTOR MANAGEMENT */}
      <div>
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-semibold">Doctor Management</h2>
          <Input
            placeholder="Search doctor..."
            value={searchDoctor}
            onChange={(e) => setSearchDoctor(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {filteredDoctors.map((doc) => (
          <Card key={doc.id} className="mb-4">
            <CardContent className="p-5 flex justify-between items-center">

              <div>
                <p className="font-semibold">
                  {doc.full_name || "Unnamed Doctor"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {doc.specialization} • {doc.hospital}
                </p>

                <Badge className="mt-2">
                  {doc.doctor_status}
                </Badge>
              </div>

              <div className="flex gap-2 flex-wrap">

                {doc.doctor_status === "pending" && (
                  <Button onClick={() => updateDoctorStatus(doc.id, "approved")}>
                    Approve
                  </Button>
                )}

                {doc.doctor_status === "approved" && (
                  <Button
                    variant="destructive"
                    onClick={() => updateDoctorStatus(doc.id, "suspended")}
                  >
                    Suspend
                  </Button>
                )}

                {doc.doctor_status === "suspended" && (
                  <Button onClick={() => updateDoctorStatus(doc.id, "approved")}>
                    Reactivate
                  </Button>
                )}

                <Button
                  className={
                    doc.is_available
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-gray-600 hover:bg-gray-700 text-white"
                  }
                  onClick={() => toggleAvailability(doc.id, doc.is_available)}
                >
                  {doc.is_available ? "Online" : "Offline"}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setSelectedDoctor(doc)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>

              </div>

            </CardContent>
          </Card>
        ))}
      </div>

      {/* SESSION MONITORING */}
      <div>
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-semibold">Session Monitoring</h2>
          <div className="flex gap-3">
            <Input
              placeholder="Search patient..."
              value={searchSession}
              onChange={(e) => setSearchSession(e.target.value)}
              className="max-w-sm"
            />
            <Button onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {filteredSessions.map((session) => (
          <Card key={session.id} className="mb-3">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="font-semibold">{session.user_name}</p>
                <Badge className={
                  session.risk_level === "RED"
                    ? "bg-red-600 text-white"
                    : session.risk_level === "YELLOW"
                    ? "bg-yellow-500 text-black"
                    : "bg-green-600 text-white"
                }>
                  {session.risk_level}
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

      {/* DOCTOR DETAIL MODAL */}
      <Dialog open={!!selectedDoctor} onOpenChange={() => setSelectedDoctor(null)}>
        <DialogContent>
          {selectedDoctor && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">
                {selectedDoctor.full_name}
              </h2>
              <p>License: {selectedDoctor.license_number}</p>
              <p>Specialization: {selectedDoctor.specialization}</p>
              <p>Hospital: {selectedDoctor.hospital}</p>
              <p>Status: {selectedDoctor.doctor_status}</p>
              <p>Available: {selectedDoctor.is_available ? "Yes" : "No"}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ADD DOCTOR MODAL */}
      <Dialog open={showAddDoctor} onOpenChange={setShowAddDoctor}>
        <DialogContent>
          <AddDoctorForm
            onSuccess={() => {
              fetchDoctors();
              setShowAddDoctor(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* ADD USER MODAL */}
      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent>
          <AddUserForm
            onSuccess={() => {
              fetchUsers();
              setShowAddUser(false);
            }}
          />
        </DialogContent>
      </Dialog>

    </div>
  );
};

/* ===============================
   KPI CARD
================================= */

const KPI = ({
  label,
  value,
  icon,
  color = "text-primary",
}: any) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    <Card>
      <CardContent className="p-6 space-y-2">
        <div className={`h-6 w-6 ${color}`}>{icon}</div>
        <p className="text-muted-foreground text-sm">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  </motion.div>
);

/* ===============================
   ADD DOCTOR FORM
================================= */

const AddDoctorForm = ({ onSuccess }: any) => {
  const [name, setName] = useState("");
  const [license, setLicense] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [hospital, setHospital] = useState("");

  const createDoctor = async () => {
    await supabase.from("profiles").insert({
      full_name: name,
      license_number: license,
      specialization: specialization,
      hospital: hospital,
      role: "doctor",
      doctor_status: "approved",
      is_available: true,
    });

    onSuccess();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Add New Doctor</h2>
      <Input
        placeholder="Doctor Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        placeholder="License Number"
        value={license}
        onChange={(e) => setLicense(e.target.value)}
      />
      <Input
        placeholder="Specialization"
        value={specialization}
        onChange={(e) => setSpecialization(e.target.value)}
      />
      <Input
        placeholder="Hospital"
        value={hospital}
        onChange={(e) => setHospital(e.target.value)}
      />
      <Button onClick={createDoctor} className="w-full">
        Create Doctor
      </Button>
    </div>
  );
};

/* ===============================
   ADD USER FORM
================================= */

const AddUserForm = ({ onSuccess }: any) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const createUser = async () => {
    await supabase.from("profiles").insert({
      full_name: name,
      email: email,
      role: "user",
    });

    onSuccess();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Add New User</h2>
      <Input
        placeholder="User Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button onClick={createUser} className="w-full">
        Create User
      </Button>
    </div>
  );
};

export default AdminDashboard;
