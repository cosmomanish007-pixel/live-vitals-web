import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Activity,
  AlertTriangle,
  TrendingUp,
  Database,
  Clock,
  BarChart3,
  UserCheck,
  Search,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  LogOut,
  Eye,
  Thermometer,
  Heart,
  Wind,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface SessionRow {
  id: string;
  user_id: string;
  user_name: string;
  age: number;
  gender: string;
  mode: string;
  state: string;
  created_at: string;
}

interface VitalRow {
  id: string;
  session_id: string;
  temp: number | null;
  hr: number | null;
  spo2: number | null;
  audio: number | null;
  status: string | null;
  created_at: string;
}

interface ProfileRow {
  id: string;
  full_name: string | null;
  role?: string;
  doctor_status?: string;
  created_at: string;
}

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [vitals, setVitals] = useState<VitalRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [pendingDoctors, setPendingDoctors] = useState<ProfileRow[]>([]);
  const [approvedDoctors, setApprovedDoctors] = useState<ProfileRow[]>([]);

  const [dbStatus, setDbStatus] = useState("Checking...");
  const [lastSync, setLastSync] = useState(new Date());
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshing, setRefreshing] = useState(false);

  const COLORS = {
    red: "#ef4444",
    yellow: "#f59e0b",
    green: "#10b981",
  };

  // ==================== INIT ====================
useEffect(() => {
  initializeDashboard();

  const cleanup = setupRealtime();

  return () => {
    if (cleanup) cleanup();
  };
}, []);

  const initializeDashboard = async () => {
    setLoading(true);
    await Promise.all([checkDbHealth(), fetchAllData()]);
    setLoading(false);
  };

  const checkDbHealth = async () => {
    try {
      const start = Date.now();
      const { error } = await supabase.from("sessions").select("id").limit(1);
      const ms = Date.now() - start;
      setDbStatus(error ? "❌ Disconnected" : `✅ Operational (${ms}ms)`);
      setLastSync(new Date());
    } catch {
      setDbStatus("❌ Error");
    }
  };

  const fetchAllData = async () => {
    await Promise.all([
      fetchSessions(),
      fetchVitals(),
      fetchProfiles(),
      fetchDoctors(),
    ]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([checkDbHealth(), fetchAllData()]);
    setRefreshing(false);
  };

  // ==================== FETCHERS ====================
  const fetchSessions = async () => {
    const { data } = await supabase
      .from("sessions")
      .select("*")
      .order("created_at", { ascending: false });
    setSessions((data as SessionRow[]) || []);
  };

  const fetchVitals = async () => {
    const { data } = await supabase.from("vitals").select("*");
    setVitals((data as VitalRow[]) || []);
  };

  const fetchProfiles = async () => {
    const { data } = await supabase.from("profiles").select("*");
    setProfiles((data as ProfileRow[]) || []);
  };

  const fetchDoctors = async () => {
    const { data: pending } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "doctor")
      .eq("doctor_status", "pending");
    setPendingDoctors((pending as ProfileRow[]) || []);

    const { data: approved } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "doctor")
      .eq("doctor_status", "approved");
    setApprovedDoctors((approved as ProfileRow[]) || []);
  };

  // ==================== REALTIME ====================
const setupRealtime = () => {
  const channel = supabase
    .channel("admin_live")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "sessions" },
      () => {
        fetchSessions();
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "vitals" },
      () => {
        fetchVitals();
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        setRealtimeConnected(true);
      } else {
        setRealtimeConnected(false);
      }
    });

  // 🔥 IMPORTANT CLEANUP
  return () => {
    channel.unsubscribe();
  };
};

  // ==================== COMPUTED ====================
  const healthStats = (() => {
    let red = 0, yellow = 0, green = 0;
    vitals.forEach((v) => {
      if (v.status === "RED") red++;
      else if (v.status === "YELLOW") yellow++;
      else if (v.status === "GREEN") green++;
    });
    return { red, yellow, green };
  })();

  const sessionsByState = (() => {
    const map: Record<string, number> = {};
    sessions.forEach((s) => {
      map[s.state] = (map[s.state] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  })();

  const hourlyHeatmap = (() => {
    const buckets = [
      { time: "00-06", count: 0 },
      { time: "06-12", count: 0 },
      { time: "12-18", count: 0 },
      { time: "18-24", count: 0 },
    ];
    sessions.forEach((s) => {
      const h = new Date(s.created_at).getHours();
      if (h < 6) buckets[0].count++;
      else if (h < 12) buckets[1].count++;
      else if (h < 18) buckets[2].count++;
      else buckets[3].count++;
    });
    return buckets;
  })();

  // Get latest vital per session for the session table
  const latestVitalBySession = (() => {
    const map: Record<string, VitalRow> = {};
    vitals.forEach((v) => {
      if (!map[v.session_id] || v.created_at > map[v.session_id].created_at) {
        map[v.session_id] = v;
      }
    });
    return map;
  })();

  const filteredSessions = sessions.filter(
    (s) =>
      s.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.state?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ==================== ACTIONS ====================
  const approveDoctor = async (doctorId: string) => {
    await supabase
      .from("profiles")
      .update({ doctor_status: "approved" } as any)
      .eq("id", doctorId);
    fetchDoctors();
  };

  const rejectDoctor = async (doctorId: string, name: string) => {
    if (!confirm(`Reject doctor application from ${name}?`)) return;
    await supabase
      .from("profiles")
      .update({ role: "user", doctor_status: null } as any)
      .eq("id", doctorId);
    fetchDoctors();
  };

  const deleteSession = async (sessionId: string, userName: string) => {
    if (!confirm(`Delete session for ${userName}?`)) return;
    await supabase.from("vitals").delete().eq("session_id", sessionId);
    await supabase.from("statuses").delete().eq("session_id", sessionId);
    await supabase.from("sessions").delete().eq("id", sessionId);
    fetchSessions();
    fetchVitals();
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const statusColor = (status: string | null) => {
    if (status === "RED") return "bg-red-500/20 text-red-400 border-red-500";
    if (status === "YELLOW") return "bg-yellow-500/20 text-yellow-400 border-yellow-500";
    if (status === "GREEN") return "bg-green-500/20 text-green-400 border-green-500";
    return "bg-muted text-muted-foreground border-border";
  };

  // ==================== LOADING ====================
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-foreground text-2xl font-bold animate-pulse mb-4">
            Loading Admin Dashboard...
          </div>
          <p className="text-muted-foreground text-sm">Initializing monitoring system</p>
        </div>
      </div>
    );
  }

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HEADER */}
      <div className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                AURA-STETH AI Management
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-muted px-3 py-2 rounded-lg border border-border hover:bg-accent transition-colors flex items-center gap-2 text-sm"
              >
                <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                Refresh
              </button>

              <div className="bg-muted px-3 py-2 rounded-lg border border-border flex items-center gap-2 text-sm">
                <Database size={14} />
                <span>{dbStatus}</span>
              </div>

              <div className="bg-muted px-3 py-2 rounded-lg border border-border flex items-center gap-2 text-sm">
                <Activity size={14} className={realtimeConnected ? "text-green-400" : "text-red-400"} />
                <span>{realtimeConnected ? "Live" : "Offline"}</span>
              </div>

              <div className="bg-muted px-3 py-2 rounded-lg border border-border flex items-center gap-2 text-sm">
                <Clock size={14} />
                <span>{lastSync.toLocaleTimeString()}</span>
              </div>

              <button
                onClick={handleLogout}
                className="bg-destructive/10 hover:bg-destructive/20 px-3 py-2 rounded-lg border border-destructive/50 transition-colors flex items-center gap-2 text-sm text-destructive"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PENDING ALERT */}
      {pendingDoctors.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="bg-yellow-500/10 border border-yellow-500/50 p-3 rounded-xl flex items-center gap-3">
            <AlertCircle size={18} className="text-yellow-400" />
            <p className="text-sm">
              <strong>{pendingDoctors.length}</strong> doctor approval{pendingDoctors.length > 1 ? "s" : ""} pending
            </p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* TABS */}
        <div className="flex gap-1 mb-6 bg-muted p-1 rounded-xl border border-border overflow-x-auto">
          {[
            { id: "overview", icon: BarChart3, label: "Overview" },
            { id: "sessions", icon: Activity, label: "Sessions" },
            { id: "doctors", icon: UserCheck, label: "Doctors" },
            { id: "analytics", icon: TrendingUp, label: "Analytics" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ==================== OVERVIEW ==================== */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-xs font-medium">Total Sessions</p>
                    <h3 className="text-3xl font-bold mt-1">{sessions.length}</h3>
                  </div>
                  <Activity className="text-primary" size={32} />
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-xs font-medium">Total Users</p>
                    <h3 className="text-3xl font-bold mt-1">{profiles.length}</h3>
                  </div>
                  <Users className="text-primary" size={32} />
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-xs font-medium">Green Vitals</p>
                    <h3 className="text-3xl font-bold mt-1 text-green-400">{healthStats.green}</h3>
                  </div>
                  <CheckCircle className="text-green-400" size={32} />
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-xs font-medium">Red Alerts</p>
                    <h3 className="text-3xl font-bold mt-1 text-red-400">{healthStats.red}</h3>
                  </div>
                  <AlertTriangle className="text-red-400" size={32} />
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Health Status Pie */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4">Health Status Distribution</h3>
                {healthStats.red + healthStats.yellow + healthStats.green > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Red (Alert)", value: healthStats.red },
                          { name: "Yellow (Attention)", value: healthStats.yellow },
                          { name: "Green (Normal)", value: healthStats.green },
                        ]}
                        cx="50%"
                        cy="50%"
                        label={(e) => `${e.name}: ${e.value}`}
                        outerRadius={90}
                        dataKey="value"
                      >
                        <Cell fill={COLORS.red} />
                        <Cell fill={COLORS.yellow} />
                        <Cell fill={COLORS.green} />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                    No vitals data yet
                  </div>
                )}
              </div>

              {/* Session State Distribution */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4">Sessions by State</h3>
                {sessionsByState.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={sessionsByState}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                    No sessions yet
                  </div>
                )}
              </div>
            </div>

            {/* Activity Heatmap */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Session Activity by Time</h3>
              {hourlyHeatmap.some((h) => h.count > 0) ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={hourlyHeatmap}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground">
                  No activity data
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== SESSIONS ==================== */}
        {activeTab === "sessions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                All Sessions
                <span className="ml-2 bg-primary/20 text-primary px-3 py-0.5 rounded-full text-sm">
                  {sessions.length}
                </span>
              </h2>
            </div>

            <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
              <Search className="text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder="Search by name, ID, or state..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-foreground placeholder-muted-foreground text-sm"
              />
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Patient</th>
                      <th className="px-4 py-3 text-left font-semibold">Age/Gender</th>
                      <th className="px-4 py-3 text-left font-semibold">State</th>
                      <th className="px-4 py-3 text-left font-semibold">Health</th>
                      <th className="px-4 py-3 text-left font-semibold">Vitals</th>
                      <th className="px-4 py-3 text-left font-semibold">Date</th>
                      <th className="px-4 py-3 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredSessions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center">
                          <Activity size={40} className="mx-auto text-muted-foreground mb-3" />
                          <p className="text-muted-foreground">
                            {searchQuery ? "No sessions match your search" : "No sessions yet"}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredSessions.map((s) => {
                        const v = latestVitalBySession[s.id];
                        return (
                          <tr key={s.id} className="hover:bg-muted/50 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-medium">{s.user_name}</p>
                              <p className="text-xs text-muted-foreground">{s.id.slice(0, 8)}...</p>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {s.age} / {s.gender}
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                                {s.state}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${statusColor(v?.status || null)}`}>
                                {v?.status || "—"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {v ? (
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1"><Thermometer size={12} />{v.temp ?? "—"}°C</span>
                                  <span className="flex items-center gap-1"><Heart size={12} />{v.hr ?? "—"}</span>
                                  <span className="flex items-center gap-1"><Wind size={12} />{v.spo2 ?? "—"}%</span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">No data</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {new Date(s.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => navigate(`/report/${s.id}`)}
                                  className="p-1.5 hover:bg-accent rounded transition-colors text-primary"
                                  title="View Report"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  onClick={() => deleteSession(s.id, s.user_name)}
                                  className="p-1.5 hover:bg-destructive/10 rounded transition-colors text-destructive"
                                  title="Delete"
                                >
                                  <XCircle size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== DOCTORS ==================== */}
        {activeTab === "doctors" && (
          <div className="space-y-6">
            {pendingDoctors.length > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4">
                  Pending Approvals ({pendingDoctors.length})
                </h3>
                <div className="space-y-3">
                  {pendingDoctors.map((doc) => (
                    <div key={doc.id} className="bg-card p-4 rounded-lg flex items-center justify-between border border-border">
                      <div>
                        <p className="font-semibold">{doc.full_name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">ID: {doc.id.slice(0, 8)}...</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveDoctor(doc.id)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 text-sm"
                        >
                          <CheckCircle size={16} />
                          Approve
                        </button>
                        <button
                          onClick={() => rejectDoctor(doc.id, doc.full_name || "Unknown")}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 text-sm"
                        >
                          <XCircle size={16} />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">
                Approved Doctors ({approvedDoctors.length})
              </h3>
              {approvedDoctors.length === 0 ? (
                <p className="text-muted-foreground text-sm">No approved doctors yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {approvedDoctors.map((doc) => (
                    <div key={doc.id} className="bg-muted border border-border rounded-lg p-4">
                      <h4 className="font-semibold">{doc.full_name || "Unknown"}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Joined: {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== ANALYTICS ==================== */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-xl p-5">
                <p className="text-muted-foreground text-xs">Completed Sessions</p>
                <p className="text-2xl font-bold mt-1">
                  {sessions.filter((s) => s.state === "COMPLETED").length}
                </p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5">
                <p className="text-muted-foreground text-xs">Active Sessions</p>
                <p className="text-2xl font-bold mt-1">
                  {sessions.filter((s) => ["STARTED", "MONITORING"].includes(s.state)).length}
                </p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5">
                <p className="text-muted-foreground text-xs">Total Vital Readings</p>
                <p className="text-2xl font-bold mt-1">{vitals.length}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5">
                <p className="text-muted-foreground text-xs">Avg Vitals/Session</p>
                <p className="text-2xl font-bold mt-1">
                  {sessions.length > 0 ? Math.round(vitals.length / sessions.length) : 0}
                </p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Session Activity by Time of Day</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={hourlyHeatmap}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
