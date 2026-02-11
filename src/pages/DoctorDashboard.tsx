import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";

interface Consultation {
  id: string;
  session_id: string;
  risk_level: string;
  status: string;
  doctor_notes: string | null;
  created_at: string;
}

const DoctorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [availability, setAvailability] = useState(true);

  /* ===============================
     FETCH DOCTOR PROFILE
  ================================ */

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("is_available")
        .eq("id", user.id)
        .maybeSingle();

      if (data) setAvailability(data.is_available);
    };

    fetchProfile();
  }, [user]);

  /* ===============================
     FETCH CONSULTATIONS
  ================================ */

  const fetchConsultations = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("consultation_requests")
      .select("*")
      .eq("doctor_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setConsultations(data);
  };

  useEffect(() => {
    fetchConsultations();
  }, [user]);

  /* ===============================
     TOGGLE AVAILABILITY
  ================================ */

  const toggleAvailability = async () => {
    const newValue = !availability;
    setAvailability(newValue);

    await supabase
      .from("profiles")
      .update({ is_available: newValue })
      .eq("id", user?.id);
  };

  /* ===============================
     UPDATE STATUS
  ================================ */

  const updateStatus = async (id: string, status: string) => {
    await supabase
      .from("consultation_requests")
      .update({ status })
      .eq("id", id);

    fetchConsultations();
  };

  /* ===============================
     ADD NOTES
  ================================ */

  const addNotes = async (id: string) => {
    const notes = prompt("Enter consultation notes:");
    if (!notes) return;

    await supabase
      .from("consultation_requests")
      .update({ doctor_notes: notes })
      .eq("id", id);

    fetchConsultations();
  };

  /* ===============================
     UI
  ================================ */

  return (
    <div className="min-h-screen bg-background p-6 space-y-8">

      <h1 className="text-3xl font-bold">Doctor Dashboard</h1>

      {/* Availability */}
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <p className="font-semibold">Available for Consultation</p>
          <Switch checked={availability} onCheckedChange={toggleAvailability} />
        </CardContent>
      </Card>

      {/* Assigned Consultations */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Assigned Consultations</h2>

        {consultations.length === 0 && (
          <p className="text-muted-foreground">No consultations assigned.</p>
        )}

        {consultations.map((c) => (
          <Card key={c.id} className="mb-4">
            <CardContent className="p-5 space-y-3">

              <div className="flex justify-between items-center">
                <div>
                  <p><strong>Session:</strong> {c.session_id}</p>
                  <Badge variant="outline">{c.risk_level}</Badge>
                </div>
                <Badge>{c.status}</Badge>
              </div>

              {c.doctor_notes && (
                <p className="text-sm text-muted-foreground">
                  Notes: {c.doctor_notes}
                </p>
              )}

              <div className="flex gap-2 flex-wrap">
                {c.status === "PENDING" && (
                  <Button onClick={() => updateStatus(c.id, "ACTIVE")}>
                    Start
                  </Button>
                )}

                {c.status !== "COMPLETED" && (
                  <Button
                    variant="secondary"
                    onClick={() => updateStatus(c.id, "COMPLETED")}
                  >
                    Complete
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => addNotes(c.id)}
                >
                  Add Notes
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => navigate(`/report/${c.session_id}`)}
                >
                  View Report
                </Button>
              </div>

            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
};

export default DoctorDashboard;