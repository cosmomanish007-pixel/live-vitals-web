import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DoctorRequest {
  id: string;
  license_number: string;
  specialization: string;
  hospital: string;
  doctor_status: string;
  is_available: boolean;
}

interface SessionData {
  id: string;
  patient_id: string;
  doctor_id: string;
  risk_level: string;
  created_at: string;
  status: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [doctorRequests, setDoctorRequests] = useState<DoctorRequest[]>([]);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  
  // Stats state
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);

  /* ===============================
     AUTHORIZATION CHECK
  ================================ */
  useEffect(() => {
    const checkAdmin = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        navigate("/");
        return;
      }

      setIsAuthorized(true);
      fetchDoctorRequests();
      fetchSessions();
      fetchStats();
    };

    checkAdmin();
  }, [navigate]);

  /* ===============================
     LOGOUT
  ================================ */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  /* ===============================
     FETCH STATS
  ================================ */
  const fetchStats = async () => {
    const { count: users } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "user");

    const { count: doctors } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "doctor");

    const { count: sessionsCount } = await supabase
      .from("sessions")
      .select("*", { count: "exact", head: true });

    setTotalUsers(users || 0);
    setTotalDoctors(doctors || 0);
    setTotalSessions(sessionsCount || 0);
  };

  /* ===============================
     FETCH DOCTOR REQUESTS
  ================================ */
  const fetchDoctorRequests = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, license_number, specialization, hospital, doctor_status, is_available")
      .eq("role", "doctor")
      .in("doctor_status", ["pending", "approved"]);

    if (error) {
      console.error("Error fetching doctor requests:", error);
      return;
    }

    if (data) setDoctorRequests(data);
  };

  /* ===============================
     APPROVE DOCTOR
  ================================ */
  const approveDoctor = async (id: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ doctor_status: "approved" })
      .eq("id", id);

    if (error) {
      console.error("Error approving doctor:", error);
      return;
    }

    fetchDoctorRequests();
  };

  /* ===============================
     REJECT DOCTOR
  ================================ */
  const rejectDoctor = async (id: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({
        role: "user",                 // revert role
        doctor_status: "rejected",    // mark rejected
        is_available: false
      })
      .eq("id", id);

    if (error) {
      console.error("Error rejecting doctor:", error);
      return;
    }

    fetchDoctorRequests();
  };

  /* ===============================
     TOGGLE DOCTOR AVAILABILITY
  ================================ */
  const toggleDoctorAvailability = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_available: !current })
      .eq("id", id);

    if (error) {
      console.error("Error toggling availability:", error);
      return;
    }

    fetchDoctorRequests();
  };

  /* ===============================
     FETCH SESSIONS
  ================================ */
  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching sessions:", error);
      return;
    }

    if (data) setSessions(data);
  };

  /* ===============================
     RENDER
  ================================ */
  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/40 p-8 space-y-12">
      {/* ===============================
          HEADER WITH LOGOUT
      ================================ */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Control Center</h1>
        <Button variant="destructive" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      {/* ===============================
          STATS CARDS
      ================================ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-bold text-primary">{totalUsers}</p>
            <p className="text-sm text-muted-foreground mt-2">Total Users</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-bold text-primary">{totalDoctors}</p>
            <p className="text-sm text-muted-foreground mt-2">Total Doctors</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-bold text-primary">{totalSessions}</p>
            <p className="text-sm text-muted-foreground mt-2">Total Sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* ===============================
          DOCTOR REQUESTS SECTION
      ================================ */}
      <Card>
        <CardHeader>
          <CardTitle>Doctor Management</CardTitle>
        </CardHeader>
        <CardContent>
          {doctorRequests.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No doctor requests at this time
            </p>
          ) : (
            <div className="space-y-4">
              {doctorRequests.map((doc) => (
                <Card key={doc.id} className="border-2">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">
                            {doc.specialization || "General Practitioner"}
                          </h3>
                          <Badge
                            variant={
                              doc.doctor_status === "approved"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {doc.doctor_status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>
                            <span className="font-medium">License:</span>{" "}
                            {doc.license_number}
                          </p>
                          <p>
                            <span className="font-medium">Hospital:</span>{" "}
                            {doc.hospital || "Not specified"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        {/* Approve/Reject Buttons */}
                        {doc.doctor_status === "pending" && (
                          <>
                            <Button onClick={() => approveDoctor(doc.id)}>
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => rejectDoctor(doc.id)}
                            >
                              Reject
                            </Button>
                          </>
                        )}

                        {/* Online/Offline Toggle */}
                        {doc.doctor_status === "approved" && (
                          <>
                            <Button
                              variant={doc.is_available ? "default" : "secondary"}
                              className={
                                doc.is_available
                                  ? "bg-green-600 hover:bg-green-700"
                                  : "bg-gray-500 hover:bg-gray-600"
                              }
                              onClick={() =>
                                toggleDoctorAvailability(doc.id, doc.is_available)
                              }
                            >
                              {doc.is_available ? "Online" : "Offline"}
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => rejectDoctor(doc.id)}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===============================
          RECENT SESSIONS SECTION
      ================================ */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No sessions available
            </p>
          ) : (
            <div className="space-y-4">
              {sessions.slice(0, 10).map((session) => (
                <Card key={session.id} className="border-2">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">
                            Session #{session.id.slice(0, 8)}
                          </h3>
                          <Badge
                            variant={
                              session.risk_level === "high"
                                ? "destructive"
                                : session.risk_level === "medium"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {session.risk_level || "N/A"} Risk
                          </Badge>
                          <Badge variant="outline">
                            {session.status || "completed"}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>
                            <span className="font-medium">Created:</span>{" "}
                            {new Date(session.created_at).toLocaleString()}
                          </p>
                          <p>
                            <span className="font-medium">Patient ID:</span>{" "}
                            {session.patient_id?.slice(0, 8) || "N/A"}
                          </p>
                          {session.doctor_id && (
                            <p>
                              <span className="font-medium">Doctor ID:</span>{" "}
                              {session.doctor_id.slice(0, 8)}
                            </p>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="secondary"
                        onClick={() => navigate(`/report/${session.id}`)}
                      >
                        View Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
