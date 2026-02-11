import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Stethoscope, CheckCircle, Activity } from "lucide-react";

interface Consultation {
  id: string;
  session_id: string;
  doctor_id: string;
  risk_level: string;
  status: string;
  created_at: string;
}

export default function DoctorDashboard() {
  const [requests, setRequests] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  /* ===============================
     LOAD INITIAL DATA
  ================================= */

  const fetchRequests = async () => {
    const { data } = await supabase
      .from("consultation_requests")
      .select("*")
      .eq("status", "PENDING")
      .order("created_at", { ascending: false });

    if (data) setRequests(data as Consultation[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  /* ===============================
     REALTIME SUBSCRIPTION
  ================================= */

  useEffect(() => {
    const channel = supabase
      .channel("doctor-consultations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "consultation_requests" },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* ===============================
     ACCEPT CONSULTATION
  ================================= */

  const acceptConsultation = async (id: string) => {
    await supabase
      .from("consultation_requests")
      .update({ status: "ACCEPTED" })
      .eq("id", id);

    fetchRequests();
  };

  /* ===============================
     UI
  ================================= */

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="max-w-3xl mx-auto space-y-6">

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-primary" />
            Doctor Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Live Consultation Requests
          </p>
        </motion.div>

        {loading && <p>Loading...</p>}

        {!loading && requests.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No pending consultations
            </CardContent>
          </Card>
        )}

        {requests.map((req) => (
          <motion.div
            key={req.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-border/50 bg-card">
              <CardContent className="p-5 space-y-4">

                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">
                      Session ID: {req.session_id}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(req.created_at).toLocaleString()}
                    </p>
                  </div>

                  <Badge
                    className={
                      req.risk_level === "RED"
                        ? "bg-red-500 text-white"
                        : req.risk_level === "YELLOW"
                        ? "bg-yellow-500 text-white"
                        : "bg-green-500 text-white"
                    }
                  >
                    {req.risk_level}
                  </Badge>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => acceptConsultation(req.id)}
                    className="gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Accept Case
                  </Button>
                </div>

              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}