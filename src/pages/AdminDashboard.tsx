import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
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
  ChevronDown,
  ChevronUp,
  Clock,
  Brain,
  Calendar,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

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
  total_sessions?: number;
  avg_risk?: string;
  last_active?: string;
}

interface SessionData {
  id: string;
  user_name: string;
  state: string;
  risk_level: string | null;
  created_at: string;
  confidence_score?: number;
}

interface RiskTrendData {
  date: string;
  RED: number;
  YELLOW: number;
  GREEN: number;
}

interface ActivityLog {
  id: string;
  user_name: string;
  created_at: string;
  action: string;
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
  const [riskTrend, setRiskTrend] = useState<RiskTrendData[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  const [searchDoctor, setSearchDoctor] = useState("");
  const [searchSession, setSearchSession] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);

  // NEW: Smart alerts
  const [highRiskCount, setHighRiskCount] = useState(0);
  const [avgConfidence, setAvgConfidence] = useState(0);

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

    if (data) {
      // Enhance with stats
      const enhanced = await Promise.all(
        data.map(async (doc) => {
          const stats = await fetchDoctorStats(doc.id);
          return { ...doc, ...stats };
        })
      );
      setDoctors(enhanced);
    }
  };

  const fetchDoctorStats = async (doctorId: string) => {
    // Fetch sessions for this doctor
    const { data: sessionData } = await supabase
      .from("consultation_requests")
      .select("risk_level, created_at")
      .eq("doctor_id", doctorId);

    if (!sessionData || sessionData.length === 0) {
      return {
        total_sessions: 0,
        avg_risk: "N/A",
        last_active: "Never",
      };
    }

    const total_sessions = sessionData.length;
    
    // Calculate average risk (weighted: RED=3, YELLOW=2, GREEN=1)
    const riskScores = sessionData.map(s => {
      if (s.risk_level === "RED") return 3;
      if (s.risk_level === "YELLOW") return 2;
      return 1;
    });
    const avgScore = riskScores.reduce((a, b) => a + b, 0) / total_sessions;
    const avg_risk = avgScore > 2.5 ? "HIGH" : avgScore > 1.5 ? "MODERATE" : "LOW";

    // Last active
    const sortedDates = sessionData.map(s => new Date(s.created_at)).sort((a, b) => b.getTime() - a.getTime());
    const last_active = sortedDates[0] ? formatRelativeTime(sortedDates[0]) : "Never";

    return { total_sessions, avg_risk, last_active };
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
          risk_level,
          confidence_score
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
          s.consultation_requests && s.consultation_requests.length > 0
            ? s.consultation_requests[0].risk_level
            : "GREEN",
        confidence_score:
          s.consultation_requests && s.consultation_requests.length > 0
            ? s.consultation_requests[0].confidence_score || 0
            : 0,
      }));

      setSessions(formatted);

      // Calculate average confidence
      const confidenceScores = formatted
        .map((s: any) => s.confidence_score)
        .filter((score: number) => score > 0);
      
      if (confidenceScores.length > 0) {
        const avg = confidenceScores.reduce((a: number, b: number) => a + b, 0) / confidenceScores.length;
        setAvgConfidence(Math.round(avg));
      }
    }
  };

  const fetchRiskTrend = async () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data } = await supabase
      .from("sessions")
      .select(`
        created_at,
        consultation_requests (
          risk_level
        )
      `)
      .gte("created_at", sevenDaysAgo.toISOString());

    if (data) {
      // Group by date
      const trendMap: Record<string, { RED: number; YELLOW: number; GREEN: number }> = {};

      data.forEach((session: any) => {
        const date = new Date(session.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        
        const risk = session.consultation_requests?.[0]?.risk_level || "GREEN";

        if (!trendMap[date]) {
          trendMap[date] = { RED: 0, YELLOW: 0, GREEN: 0 };
        }

        trendMap[date][risk as "RED" | "YELLOW" | "GREEN"]++;
      });

      const trendData = Object.keys(trendMap).map((date) => ({
        date,
        ...trendMap[date],
      }));

      setRiskTrend(trendData);
    }
  };

  const fetchTodayRisk = async () => {
    const today = new Date().toISOString().split("T")[0];

    const { data } = await supabase
      .from("sessions")
      .select(`
        consultation_requests (
          risk_level
        )
      `)
      .gte("created_at", today);

    if (data) {
      const redCount = data.filter(
        (s: any) => s.consultation_requests?.[0]?.risk_level === "RED"
      ).length;
      setHighRiskCount(redCount);
    }
  };

  const fetchActivityLogs = async () => {
    const { data } = await supabase
      .from("sessions")
      .select("id, user_name, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (data) {
      const logs = data.map((s) => ({
        id: s.id,
        user_name: s.user_name,
        created_at: s.created_at,
        action: "created session",
      }));
      setActivityLogs(logs);
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
    fetchRiskTrend();
    fetchTodayRisk();
    fetchActivityLogs();
  }, [authorized]);

  /* ===============================
     KPIs
  ================================ */

  const totalDoctors = doctors.length;
  const approvedDoctors = doctors.filter((d) => d.doctor_status === "approved").length;
  const pendingDoctors = doctors.filter((d) => d.doctor_status === "pending").length;
  const suspendedDoctors = doctors.filter((d) => d.doctor_status === "suspended").length;
  const onlineDoctors = doctors.filter((d) => d.is_available).length;

  const totalSessions = sessions.length;
  const activeSessions = sessions.filter((s) => s.state === "ongoing").length;
  const redRisk = sessions.filter((s) => s.risk_level === "RED").length || 0;
  const yellowRisk = sessions.filter((s) => s.risk_level === "YELLOW").length || 0;
  const greenRisk = sessions.filter((s) => s.risk_level === "GREEN").length || 0;

  /* ===============================
     FILTERING
  ================================ */

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) =>
      (doc.full_name || "").toLowerCase().includes(searchDoctor.toLowerCase())
    );
  }, [doctors, searchDoctor]);

  const filteredSessions = useMemo(() => {
    let filtered = sessions.filter((s) =>
      s.user_name.toLowerCase().includes(searchSession.toLowerCase())
    );

    if (dateFilter) {
      filtered = filtered.filter((s) =>
        s.created_at.startsWith(dateFilter)
      );
    }

    return filtered;
  }, [sessions, searchSession, dateFilter]);

  /* ===============================
     ACTIONS
  ================================ */

  const updateDoctorStatus = async (id: string, status: string) => {
    await supabase
      .from("profiles")
      .update({ doctor_status: status })
      .eq("id", id);

    fetchDoctors();
  };

  const toggleAvailability = async (id: string, current: boolean | null) => {
    await supabase
      .from("profiles")
      .update({ is_available: !current })
      .eq("id", id);

    fetchDoctors();
  };

  const exportCSV = () => {
    const csvRows = [
      ["Patient", "Risk", "State", "Confidence", "Created"],
      ...sessions.map((s) => [
        s.user_name,
        s.risk_level,
        s.state,
        s.confidence_score || 0,
        s.created_at,
      ]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      csvRows.map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sessions_export.csv");
    document.body.appendChild(link);
    link.click();
  };

  const refreshAll = () => {
    fetchDoctors();
    fetchSessions();
    fetchUsers();
    fetchRiskTrend();
    fetchTodayRisk();
    fetchActivityLogs();
  };

  /* ===============================
     HELPERS
  ================================ */

  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  /* ===============================
     LOADING
  ================================ */

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="animate-spin h-8 w-8" />
      </div>
    );

  if (!authorized) return null;

  /* ===============================
     UI
  ================================ */

  return (
    <div className="min-h-screen bg-background text-foreground p-8 space-y-8">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Hospital Operations Command Center</h1>
          <p className="text-muted-foreground mt-1">Real-time clinical intelligence & resource management</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowAddDoctor(true)}>
            <Stethoscope className="h-4 w-4 mr-2" />
            Add Doctor
          </Button>
          <Button variant="secondary" onClick={() => setShowAddUser(true)}>
            <Users className="h-4 w-4 mr-2" />
            Add User
          </Button>
          <Button onClick={refreshAll} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* SMART ALERTS */}
      <AnimatePresence>
        {highRiskCount > 3 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-500/10 border border-red-500 p-4 rounded-lg flex items-center gap-3"
          >
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div>
              <p className="font-semibold text-red-500">⚠️ Risk Spike Detected</p>
              <p className="text-sm text-muted-foreground">
                {highRiskCount} high-risk sessions in the last 24 hours. Immediate attention required.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI GRID */}
      <div className="grid lg:grid-cols-5 gap-6">
        <KPI label="Total Users" value={totalUsers} icon={<Users />} />
        <KPI label="Total Doctors" value={totalDoctors} icon={<Stethoscope />} />
        <KPI label="Online Now" value={onlineDoctors} icon={<Activity />} color="text-green-500" />
        <KPI label="Active Sessions" value={activeSessions} icon={<Clock />} color="text-blue-500" />
        <KPI label="AI Confidence" value={`${avgConfidence}%`} icon={<Brain />} color="text-purple-500" />
        
        <KPI label="Approved Doctors" value={approvedDoctors} icon={<UserCheck />} color="text-green-500" />
        <KPI label="Pending" value={pendingDoctors} icon={<AlertTriangle />} color="text-yellow-500" />
        <KPI label="Suspended" value={suspendedDoctors} icon={<UserX />} color="text-red-500" />
        <KPI label="Total Sessions" value={totalSessions} icon={<BarChart3 />} />
        <KPI label="High Risk" value={redRisk} icon={<AlertTriangle />} color="text-red-500" />
      </div>

      {/* RISK TREND ANALYTICS */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Risk Trend Analytics (Last 7 Days)</h2>
            <Badge variant="outline">Real-time Data</Badge>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={riskTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="RED" fill="#ef4444" name="High Risk" />
              <Bar dataKey="YELLOW" fill="#facc15" name="Moderate Risk" />
              <Bar dataKey="GREEN" fill="#22c55e" name="Stable" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* RISK DISTRIBUTION METERS */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-6">Current Risk Distribution</h2>
          <div className="space-y-6">
            <RiskMeter label="High Risk" value={redRisk} total={totalSessions} color="bg-red-500" />
            <RiskMeter label="Moderate Risk" value={yellowRisk} total={totalSessions} color="bg-yellow-500" />
            <RiskMeter label="Stable" value={greenRisk} total={totalSessions} color="bg-green-500" />
          </div>
        </CardContent>
      </Card>

      {/* TWO COLUMN LAYOUT */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* ACTIVITY TIMELINE */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </h2>
            <div className="space-y-3">
              {activityLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 text-sm">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
                  <div>
                    <p className="font-medium">{log.user_name}</p>
                    <p className="text-muted-foreground">{log.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(new Date(log.created_at))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* DOCTOR PERFORMANCE SUMMARY */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Top Performing Doctors</h2>
            <div className="space-y-3">
              {doctors
                .filter((d) => d.total_sessions && d.total_sessions > 0)
                .sort((a, b) => (b.total_sessions || 0) - (a.total_sessions || 0))
                .slice(0, 5)
                .map((doc) => (
                  <div key={doc.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-semibold">{doc.full_name}</p>
                      <p className="text-sm text-muted-foreground">{doc.specialization}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{doc.total_sessions} sessions</p>
                      <Badge variant={doc.avg_risk === "HIGH" ? "destructive" : "secondary"}>
                        {doc.avg_risk} avg risk
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

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
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-semibold text-lg">{doc.full_name || "Unnamed Doctor"}</p>
                    <Badge variant={doc.is_available ? "default" : "secondary"}>
                      {doc.is_available ? "Online" : "Offline"}
                    </Badge>
                    <Badge>{doc.doctor_status}</Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {doc.specialization} • {doc.hospital}
                  </p>

                  {/* DOCTOR INTELLIGENCE */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Sessions</p>
                      <p className="font-semibold">{doc.total_sessions || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg Risk Level</p>
                      <p className="font-semibold">{doc.avg_risk || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Active</p>
                      <p className="font-semibold">{doc.last_active || "Never"}</p>
                    </div>
                  </div>
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
                    {doc.is_available ? "Set Offline" : "Set Online"}
                  </Button>

                  <Button variant="outline" onClick={() => setSelectedDoctor(doc)}>
                    <Eye className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                </div>

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
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="max-w-[180px]"
            />
            <Input
              placeholder="Search patient..."
              value={searchSession}
              onChange={(e) => setSearchSession(e.target.value)}
              className="max-w-sm"
            />
            <Button onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {filteredSessions.map((session) => (
          <Card key={session.id} className="mb-3">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-semibold">{session.user_name}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge
                        className={
                          session.risk_level === "RED"
                            ? "bg-red-600 text-white"
                            : session.risk_level === "YELLOW"
                            ? "bg-yellow-500 text-black"
                            : "bg-green-600 text-white"
                        }
                      >
                        {session.risk_level}
                      </Badge>
                      <Badge variant="outline">{session.state}</Badge>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setExpandedSession(
                        expandedSession === session.id ? null : session.id
                      )
                    }
                  >
                    {expandedSession === session.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => navigate(`/report/${session.id}`)}
                  >
                    View Report
                  </Button>
                </div>
              </div>

              {/* EXPANDABLE DETAILS */}
              <AnimatePresence>
                {expandedSession === session.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 pt-4 border-t text-sm space-y-2"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-muted-foreground">Session ID</p>
                        <p className="font-mono">{session.id}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Created</p>
                        <p>{new Date(session.created_at).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">AI Confidence</p>
                        <p>{session.confidence_score || 0}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <p className="capitalize">{session.state}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* DOCTOR DETAIL MODAL */}
      <Dialog open={!!selectedDoctor} onOpenChange={() => setSelectedDoctor(null)}>
        <DialogContent>
          {selectedDoctor && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">{selectedDoctor.full_name}</h2>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">License Number:</span>
                  <span className="font-medium">{selectedDoctor.license_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Specialization:</span>
                  <span className="font-medium">{selectedDoctor.specialization}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hospital:</span>
                  <span className="font-medium">{selectedDoctor.hospital}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge>{selectedDoctor.doctor_status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Available:</span>
                  <Badge variant={selectedDoctor.is_available ? "default" : "secondary"}>
                    {selectedDoctor.is_available ? "Online" : "Offline"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Sessions:</span>
                  <span className="font-medium">{selectedDoctor.total_sessions || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Risk Level:</span>
                  <span className="font-medium">{selectedDoctor.avg_risk || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Active:</span>
                  <span className="font-medium">{selectedDoctor.last_active || "Never"}</span>
                </div>
              </div>
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
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
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
   RISK METER
================================= */

const RiskMeter = ({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) => {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {value} / {total} ({percentage}%)
        </span>
      </div>
      <Progress value={percentage} className={`h-3 ${color}`} />
    </div>
  );
};

/* ===============================
   ADD DOCTOR FORM
================================= */

const AddDoctorForm = ({ onSuccess }: any) => {
  const [name, setName] = useState("");
  const [license, setLicense] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [hospital, setHospital] = useState("");

  const createDoctor = async () => {
    if (!name || !license) {
      alert("Please fill in required fields");
      return;
    }

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
        placeholder="Doctor Name *"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        placeholder="License Number *"
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
    if (!name || !email) {
      alert("Please fill in all fields");
      return;
    }

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
        placeholder="User Name *"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        placeholder="Email *"
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
