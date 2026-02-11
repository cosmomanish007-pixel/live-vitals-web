import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface Consultation {
  id: string;
  risk_level: string;
  status: string;
  created_at: string;
  sessions: {
    id: string;
    user_name: string;
    age: number;
  };
}

const DoctorDashboard = () => {
  const [requests, setRequests] = useState<Consultation[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();

    // 🔴 REALTIME SUBSCRIPTION
    const channel = supabase
      .channel("consultation_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "consultation_requests",
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from("consultation_requests")
      .select(`
        id,
        risk_level,
        status,
        created_at,
        sessions (
          id,
          user_name,
          age
        )
      `)
      .eq("status", "PENDING")
      .order("created_at", { ascending: false });

    if (data) setRequests(data as any);
  };

  const acceptRequest = async (id: string) => {
    await supabase
      .from("consultation_requests")
      .update({ status: "ACCEPTED" })
      .eq("id", id);

    fetchRequests();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <h1 className="text-2xl font-bold mb-6">Doctor Dashboard</h1>

      <div className="space-y-4">
        {requests.length === 0 && (
          <p className="text-muted-foreground">No active consultations.</p>
        )}

        {requests.map((req) => (
          <motion.div
            key={req.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-border/50 bg-card">
              <CardContent className="p-5 space-y-3">
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold">
                      {req.sessions.user_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Age {req.sessions.age}
                    </p>
                  </div>

                  <div
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      req.risk_level === "RED"
                        ? "bg-red-500/20 text-red-500"
                        : req.risk_level === "YELLOW"
                        ? "bg-yellow-500/20 text-yellow-500"
                        : "bg-green-500/20 text-green-500"
                    }`}
                  >
                    {req.risk_level}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() =>
                      navigate(`/report/${req.sessions.id}`)
                    }
                    className="flex-1"
                  >
                    View Report
                  </Button>

                  <Button
                    onClick={() => acceptRequest(req.id)}
                    className="flex-1"
                    variant="secondary"
                  >
                    Accept
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default DoctorDashboard;