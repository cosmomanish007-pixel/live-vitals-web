import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

import {
  Users,
  Activity,
  AlertTriangle,
  TrendingUp,
  Shield,
  Database,
  Clock,
  BarChart3,
  UserCheck,
  FileText,
  Search,
  CheckCircle,
  XCircle,
  Zap,
  RefreshCw,
  AlertCircle,
  LogOut,
  Eye,
  Edit,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";



const AdminDashboard = () => {
  // ==================== STATE MANAGEMENT ====================
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Core Data
  const [sessions, setSessions] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [pendingDoctors, setPendingDoctors] = useState([]);

  // Metrics
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [avgConfidence, setAvgConfidence] = useState(0);
  const [riskStats, setRiskStats] = useState({ red: 0, yellow: 0, green: 0 });
  const [doctorLoad, setDoctorLoad] = useState({});

  // System Health
  const [dbStatus, setDbStatus] = useState("Checking...");
  const [lastSync, setLastSync] = useState(new Date());
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  // Trend Data
  const [riskTrend, setRiskTrend] = useState([]);
  const [hourlyHeatmap, setHourlyHeatmap] = useState([]);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState([]);

  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshing, setRefreshing] = useState(false);

  // ==================== CONSTANTS ====================
  const COLORS = {
    red: "#ef4444",
    yellow: "#f59e0b",
    green: "#10b981",
  };

  // ==================== AUTHENTICATION ====================
  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "ADMIN") {
      alert("⛔ Access Denied: Admin privileges required");
      window.location.href = "/";
      return;
    }

    setUser(user);
    initializeDashboard();
  };

  // ==================== INITIALIZATION ====================
  const initializeDashboard = async () => {
    setLoading(true);

    await Promise.all([
      checkDatabaseHealth(),
      fetchAllData(),
      setupRealtimeSubscription(),
    ]);

    setLoading(false);
  };

  // ==================== DATABASE HEALTH ====================
  const checkDatabaseHealth = async () => {
    try {
      const startTime = Date.now();
      const { error } = await supabase.from("sessions").select("id").limit(1);
      const responseTime = Date.now() - startTime;

      if (error) {
        setDbStatus("❌ Disconnected");
        console.error("DB Health Error:", error);
      } else {
        setDbStatus(`✅ Operational (${responseTime}ms)`);
      }
      setLastSync(new Date());
    } catch (err) {
      setDbStatus("❌ Error");
      console.error("DB Health Check Failed:", err);
    }
  };

  // ==================== FETCH ALL DATA ====================
  const fetchAllData = async () => {
    await Promise.all([
      fetchSessions(),
      fetchSessionCount(),
      fetchRiskStats(),
      fetchConfidenceAnalytics(),
      fetchDoctors(),
      fetchPendingDoctors(),
      fetchUserCount(),
      fetchDoctorLoad(),
      fetchRiskTrend(),
      fetchHourlyHeatmap(),
      fetchAuditLogs(),
    ]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await checkDatabaseHealth();
    await fetchAllData();
    setRefreshing(false);
  };

  // ==================== DATA FETCHERS ====================

  // ✅ FIX: Fetch ALL sessions (no limit)
  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select(
          `
          id,
          user_name,
          state,
          created_at,
          risk_level,
          confidence_score,
          doctor_id,
          status
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Session fetch error:", error);
        return;
      }

      console.log(`✅ Fetched ${data?.length || 0} sessions`);
      console.log("📋 First session (debug):", data?.[0]);
      setSessions(data || []);
    } catch (err) {
      console.error("Session fetch failed:", err);
    }
  };

  // ✅ FIX: Get real count from DB
  const fetchSessionCount = async () => {
    try {
      const { count, error } = await supabase
        .from("sessions")
        .select("*", { count: "exact", head: true });

      if (error) {
        console.error("❌ Session count error:", error);
        return;
      }

      console.log(`✅ Total sessions in DB: ${count}`);
      setTotalSessions(count || 0);
    } catch (err) {
      console.error("Session count failed:", err);
    }
  };

  // ✅ FIX: Calculate real risk distribution
  const fetchRiskStats = async () => {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select("risk_level");

      if (error || !data) {
        console.error("❌ Risk stats error:", error);
        return;
      }

      const red = data.filter((s) => s.risk_level === "RED").length;
      const yellow = data.filter((s) => s.risk_level === "YELLOW").length;
      const green = data.filter((s) => s.risk_level === "GREEN").length;

      console.log(
        `✅ Risk Distribution: RED=${red}, YELLOW=${yellow}, GREEN=${green}`
      );
      setRiskStats({ red, yellow, green });
    } catch (err) {
      console.error("Risk stats failed:", err);
    }
  };

  // ✅ FIX: Calculate real AI confidence
  const fetchConfidenceAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select("confidence_score");

      if (error || !data?.length) {
        console.log("⚠️ No confidence data available");
        setAvgConfidence(0);
        return;
      }

      const avg =
        data.reduce((a, b) => a + (b.confidence_score || 0), 0) / data.length;

      console.log(`✅ Average AI Confidence: ${Math.round(avg)}%`);
      setAvgConfidence(Math.round(avg));
    } catch (err) {
      console.error("Confidence analytics failed:", err);
      setAvgConfidence(0);
    }
  };

  const fetchDoctors = async () => {
    try {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("role", "DOCTOR")
        .eq("approved", true);

      setDoctors(data || []);
    } catch (err) {
      console.error("Fetch doctors failed:", err);
    }
  };

  const fetchPendingDoctors = async () => {
    try {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("role", "DOCTOR")
        .eq("approved", false);

      setPendingDoctors(data || []);
    } catch (err) {
      console.error("Fetch pending doctors failed:", err);
    }
  };

  const fetchUserCount = async () => {
    try {
      const { count } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

      setTotalUsers(count || 0);
    } catch (err) {
      console.error("User count failed:", err);
    }
  };

  // ✅ NEW: Doctor load index
  const fetchDoctorLoad = async () => {
    try {
      const { data } = await supabase.from("sessions").select("doctor_id");

      const loadMap = {};
      data?.forEach((s) => {
        if (s.doctor_id) {
          loadMap[s.doctor_id] = (loadMap[s.doctor_id] || 0) + 1;
        }
      });

      console.log(`✅ Doctor load calculated:`, loadMap);
      setDoctorLoad(loadMap);
    } catch (err) {
      console.error("Doctor load failed:", err);
    }
  };

  // ✅ NEW: 7-day risk trend
  const fetchRiskTrend = async () => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const { data } = await supabase
        .from("sessions")
        .select("created_at, risk_level")
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: true });

      if (!data) {
        console.log("⚠️ No trend data available");
        return;
      }

      const trendMap = {};
      data.forEach((s) => {
        const day = new Date(s.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        if (!trendMap[day]) {
          trendMap[day] = { date: day, red: 0, yellow: 0, green: 0 };
        }
        const level = s.risk_level?.toLowerCase() || "green";
        trendMap[day][level]++;
      });

      const trendData = Object.values(trendMap);
      console.log(`✅ Risk trend data: ${trendData.length} days`);
      setRiskTrend(trendData);
    } catch (err) {
      console.error("Risk trend failed:", err);
    }
  };

  // ✅ NEW: Hourly heatmap
  const fetchHourlyHeatmap = async () => {
    try {
      const { data } = await supabase.from("sessions").select("created_at");

      if (!data) return;

      const heatmap = [
        { time: "00-06", count: 0 },
        { time: "06-12", count: 0 },
        { time: "12-18", count: 0 },
        { time: "18-24", count: 0 },
      ];

      data.forEach((s) => {
        const hour = new Date(s.created_at).getHours();
        if (hour < 6) heatmap[0].count++;
        else if (hour < 12) heatmap[1].count++;
        else if (hour < 18) heatmap[2].count++;
        else heatmap[3].count++;
      });

      console.log(`✅ Hourly heatmap calculated`);
      setHourlyHeatmap(heatmap);
    } catch (err) {
      console.error("Hourly heatmap failed:", err);
    }
  };

  // ✅ NEW: Audit logs
  const fetchAuditLogs = async () => {
    try {
      const { data } = await supabase
        .from("admin_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      console.log(`✅ Fetched ${data?.length || 0} audit logs`);
      setAuditLogs(data || []);
    } catch (err) {
      console.error("Audit logs failed:", err);
    }
  };

  // ==================== REALTIME SUBSCRIPTION ====================
  const setupRealtimeSubscription = () => {
    console.log("🔄 Setting up realtime subscription...");

    const channel = supabase
      .channel("admin_live_sessions")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sessions",
        },
        (payload) => {
          console.log("🔴 NEW SESSION CREATED:", payload.new);
          setSessions((prev) => [payload.new, ...prev]);
          setTotalSessions((prev) => prev + 1);
          fetchRiskStats();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
        },
        (payload) => {
          console.log("🟡 SESSION UPDATED:", payload.new);
          setSessions((prev) =>
            prev.map((s) => (s.id === payload.new.id ? payload.new : s))
          );
        }
      )
      .subscribe((status) => {
        console.log("📡 Realtime status:", status);
        setRealtimeConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // ==================== LOGOUT HANDLER ====================
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // ==================== ADMIN ACTIONS ====================

  const approveDoctor = async (doctorId, doctorName) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ approved: true })
        .eq("id", doctorId);

      if (!error && user) {
        await supabase.from("admin_logs").insert({
          action: `✅ Approved Doctor: ${doctorName} (ID: ${doctorId.slice(
            0,
            8
          )})`,
          admin_id: user.id,
        });

        console.log(`✅ Doctor approved: ${doctorName}`);
        fetchPendingDoctors();
        fetchDoctors();
        fetchAuditLogs();
      } else {
        console.error("❌ Error approving doctor:", error);
      }
    } catch (err) {
      console.error("Approve doctor failed:", err);
    }
  };

  const rejectDoctor = async (doctorId, doctorName) => {
    if (!confirm(`Are you sure you want to reject Dr. ${doctorName}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", doctorId);

      if (!error && user) {
        await supabase.from("admin_logs").insert({
          action: `❌ Rejected Doctor: ${doctorName} (ID: ${doctorId.slice(
            0,
            8
          )})`,
          admin_id: user.id,
        });

        console.log(`❌ Doctor rejected: ${doctorName}`);
        fetchPendingDoctors();
        fetchAuditLogs();
      } else {
        console.error("❌ Error rejecting doctor:", error);
      }
    } catch (err) {
      console.error("Reject doctor failed:", err);
    }
  };

  const deleteSession = async (sessionId, userName) => {
    if (!confirm(`Delete session for ${userName}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("sessions")
        .delete()
        .eq("id", sessionId);

      if (!error && user) {
        await supabase.from("admin_logs").insert({
          action: `🗑️ Deleted Session: ${userName} (ID: ${sessionId.slice(
            0,
            8
          )})`,
          admin_id: user.id,
        });

        console.log(`✅ Session deleted: ${userName}`);
        fetchSessions();
        fetchSessionCount();
        fetchAuditLogs();
      } else {
        console.error("❌ Error deleting session:", error);
      }
    } catch (err) {
      console.error("Delete session failed:", err);
    }
  };

  // ==================== SEARCH FILTER ====================
  const filteredSessions = sessions.filter(
    (s) =>
      s.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.risk_level?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ==================== LOADING STATE ====================
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-3xl font-bold animate-pulse mb-4">
            🏥 Loading Enterprise Dashboard...
          </div>
          <div className="text-gray-400 text-sm">
            Initializing real-time monitoring system
          </div>
        </div>
      </div>
    );
  }

  // ==================== MAIN RENDER ====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* HEADER */}
      <div className="border-b border-purple-500/30 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                🏥 Enterprise Admin Command Center
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Real-time Hospital Management System v4.0
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700 hover:bg-gray-700/50 transition-colors flex items-center gap-2"
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />
                <span className="text-sm">Refresh</span>
              </button>

              <div className="bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2">
                  <Database size={16} />
                  <span className="text-sm">{dbStatus}</span>
                </div>
              </div>

              <div className="bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2">
                  <Activity
                    size={16}
                    className={
                      realtimeConnected ? "text-green-400" : "text-red-400"
                    }
                  />
                  <span className="text-sm">
                    {realtimeConnected ? "Live" : "Offline"}
                  </span>
                </div>
              </div>

              <div className="bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span className="text-sm">
                    {lastSync.toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="bg-red-600/20 hover:bg-red-600/30 px-4 py-2 rounded-lg border border-red-500/50 transition-colors flex items-center gap-2"
              >
                <LogOut size={16} />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* EMERGENCY ALERT */}
      {riskStats.red > 5 && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-red-500/20 border-2 border-red-500 p-4 rounded-xl animate-pulse">
            <div className="flex items-center gap-3">
              <AlertTriangle size={24} className="text-red-400" />
              <div>
                <h3 className="font-bold text-lg">
                  🚨 HIGH RISK SURGE DETECTED
                </h3>
                <p className="text-sm text-gray-300">
                  {riskStats.red} critical cases require immediate attention
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PENDING APPROVALS ALERT */}
      {pendingDoctors.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 py-2">
          <div className="bg-yellow-500/20 border border-yellow-500 p-3 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-yellow-400" />
              <p className="text-sm">
                <strong>{pendingDoctors.length}</strong> doctor approval
                {pendingDoctors.length > 1 ? "s" : ""} pending
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* TABS */}
        <div className="flex gap-2 mb-6 bg-gray-800/30 p-1 rounded-xl border border-gray-700 overflow-x-auto">
          {[
            { id: "overview", icon: BarChart3, label: "Overview" },
            { id: "sessions", icon: Activity, label: "Sessions" },
            { id: "doctors", icon: UserCheck, label: "Doctors" },
            { id: "analytics", icon: TrendingUp, label: "Analytics" },
            { id: "audit", icon: FileText, label: "Audit" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-purple-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-700/50"
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">
                      Total Sessions
                    </p>
                    <h3 className="text-4xl font-bold mt-2">{totalSessions}</h3>
                  </div>
                  <Activity className="text-blue-400" size={40} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">
                      Total Users
                    </p>
                    <h3 className="text-4xl font-bold mt-2">{totalUsers}</h3>
                  </div>
                  <Users className="text-purple-400" size={40} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">
                      AI Confidence
                    </p>
                    <h3 className="text-4xl font-bold mt-2">{avgConfidence}%</h3>
                  </div>
                  <Zap className="text-green-400" size={40} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-600/20 to-red-800/20 border border-red-500/30 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">
                      High Risk Cases
                    </p>
                    <h3 className="text-4xl font-bold mt-2">{riskStats.red}</h3>
                  </div>
                  <AlertTriangle className="text-red-400" size={40} />
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Shield size={20} />
                  Risk Distribution
                </h3>
                {riskStats.red + riskStats.yellow + riskStats.green > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "High Risk", value: riskStats.red },
                          { name: "Medium Risk", value: riskStats.yellow },
                          { name: "Low Risk", value: riskStats.green },
                        ]}
                        cx="50%"
                        cy="50%"
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={100}
                        dataKey="value"
                      >
                        <Cell fill={COLORS.red} />
                        <Cell fill={COLORS.yellow} />
                        <Cell fill={COLORS.green} />
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "1px solid #374151",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No data available
                  </div>
                )}
              </div>

              {/* Line Chart */}
              <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp size={20} />
                  7-Day Risk Trend
                </h3>
                {riskTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={riskTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "1px solid #374151",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="red"
                        stroke={COLORS.red}
                        strokeWidth={3}
                        name="High Risk"
                      />
                      <Line
                        type="monotone"
                        dataKey="yellow"
                        stroke={COLORS.yellow}
                        strokeWidth={3}
                        name="Medium Risk"
                      />
                      <Line
                        type="monotone"
                        dataKey="green"
                        stroke={COLORS.green}
                        strokeWidth={3}
                        name="Low Risk"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No trend data
                  </div>
                )}
              </div>
            </div>

            {/* Heatmap */}
            <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <BarChart3 size={20} />
                Session Activity Heatmap
              </h3>
              {hourlyHeatmap.some((h) => h.count > 0) ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={hourlyHeatmap}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                      }}
                    />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-gray-500">
                  No activity data
                </div>
              )}
            </div>
          </div>
        )}

        {/* SESSIONS TAB */}
        {activeTab === "sessions" && (
          <div className="space-y-6">
            {/* Header with count */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                Session Monitoring
                <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm font-semibold">
                  {sessions.length} Total
                </span>
              </h2>
              <p className="text-sm text-gray-400">
                Last synced: {lastSync.toLocaleString()}
              </p>
            </div>

            <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Search className="text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search sessions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-white placeholder-gray-500"
                />
              </div>
            </div>

            <div className="bg-gray-800/30 border border-gray-700 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Patient
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        State
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Risk
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Confidence
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Created
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredSessions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-16 text-center"
                        >
                          <div className="flex flex-col items-center justify-center">
                            <Activity
                              size={48}
                              className="text-gray-600 mb-4"
                            />
                            <p className="text-gray-500 text-lg font-medium mb-2">
                              {searchQuery
                                ? "No sessions match your search"
                                : "No sessions found"}
                            </p>
                            <p className="text-gray-600 text-sm">
                              {searchQuery
                                ? "Try adjusting your search terms"
                                : "Sessions will appear here once patients start consultations"}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredSessions.map((session) => (
                        <tr
                          key={session.id}
                          className="hover:bg-gray-700/30 hover:shadow-lg transition-all cursor-pointer"
                        >
                          <td className="px-6 py-4">
                            <p className="font-medium">
                              {session.user_name || "Unknown"}
                            </p>
                            <p className="text-xs text-gray-400">
                              {session.id?.slice(0, 8) || "N/A"}...
                            </p>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {session.state || "N/A"}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                session.risk_level === "RED"
                                  ? "bg-red-500/20 text-red-400 border border-red-500"
                                  : session.risk_level === "YELLOW"
                                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500"
                                  : "bg-green-500/20 text-green-400 border border-green-500"
                              }`}
                            >
                              {session.risk_level || "UNKNOWN"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {session.confidence_score || 0}%
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">
                            {new Date(session.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  (window.location.href = `/report/${session.id}`)
                                }
                                className="text-blue-400 hover:text-blue-300 transition-colors p-2 hover:bg-blue-500/10 rounded"
                                title="View session"
                              >
                                <Eye size={18} />
                              </button>
                              <button
                                onClick={() =>
                                  (window.location.href = `/session/${session.id}`)
                                }
                                className="text-yellow-400 hover:text-yellow-300 transition-colors p-2 hover:bg-yellow-500/10 rounded"
                                title="Edit session"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() =>
                                  deleteSession(session.id, session.user_name)
                                }
                                className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-red-500/10 rounded"
                                title="Delete session"
                              >
                                <XCircle size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* DOCTORS TAB */}
        {activeTab === "doctors" && (
          <div className="space-y-6">
            {pendingDoctors.length > 0 && (
              <div className="bg-yellow-500/10 border-2 border-yellow-500 rounded-xl p-6">
                <h3 className="text-2xl font-bold mb-4">
                  Pending Approvals ({pendingDoctors.length})
                </h3>
                <div className="space-y-3">
                  {pendingDoctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      className="bg-gray-800/50 p-5 rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-lg">{doctor.name}</p>
                        <p className="text-sm text-gray-400">{doctor.email}</p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() =>
                            approveDoctor(doctor.id, doctor.name)
                          }
                          className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2"
                        >
                          <CheckCircle size={18} />
                          Approve
                        </button>
                        <button
                          onClick={() => rejectDoctor(doctor.id, doctor.name)}
                          className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2"
                        >
                          <XCircle size={18} />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
              <h3 className="text-2xl font-bold mb-6">
                Approved Doctors ({doctors.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {doctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className="bg-gray-700/30 border border-gray-600 rounded-lg p-5"
                  >
                    <h4 className="font-semibold text-lg">{doctor.name}</h4>
                    <p className="text-sm text-gray-400">{doctor.email}</p>
                    <div className="mt-4 pt-4 border-t border-gray-600">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">
                          Load Index:
                        </span>
                        <span className="font-bold text-purple-400">
                          {doctorLoad[doctor.id] || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
                <h3 className="text-2xl font-bold mb-6">
                  Doctor Performance Rankings
                </h3>
                <div className="space-y-3">
                  {doctors
                    .sort(
                      (a, b) =>
                        (doctorLoad[b.id] || 0) - (doctorLoad[a.id] || 0)
                    )
                    .slice(0, 10)
                    .map((doctor, idx) => (
                      <div
                        key={doctor.id}
                        className="flex items-center justify-between bg-gray-700/30 p-4 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-2xl font-bold text-purple-400">
                            #{idx + 1}
                          </div>
                          <div>
                            <p className="font-semibold">{doctor.name}</p>
                            <p className="text-xs text-gray-400">
                              {doctorLoad[doctor.id] || 0} sessions
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
                <h3 className="text-2xl font-bold mb-6">System Analytics</h3>
                <div className="space-y-4">
                  <div className="bg-blue-500/10 border border-blue-500/30 p-5 rounded-lg">
                    <p className="text-sm text-gray-400">Avg Confidence</p>
                    <p className="text-3xl font-bold text-blue-400">
                      {avgConfidence}%
                    </p>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/30 p-5 rounded-lg">
                    <p className="text-sm text-gray-400">Resolution Rate</p>
                    <p className="text-3xl font-bold text-green-400">
                      {totalSessions > 0
                        ? Math.round(
                            ((totalSessions - riskStats.red) / totalSessions) *
                              100
                          )
                        : 0}
                      %
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AUDIT TAB */}
        {activeTab === "audit" && (
          <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
            <h3 className="text-2xl font-bold mb-6">Admin Audit Log</h3>
            {auditLogs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No audit logs yet
              </div>
            ) : (
              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-gray-700/30 p-4 rounded-lg flex items-center justify-between"
                  >
                    <p className="font-medium">{log.action}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;


