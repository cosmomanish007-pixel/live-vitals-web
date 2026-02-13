import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface MedicineItem {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface Consultation {
  id: string;
  session_id: string;
  risk_level: "GREEN" | "YELLOW" | "RED";
  status: "PENDING" | "ACTIVE" | "COMPLETED";
  doctor_notes: string | null;
  diagnosis?: string | null;
  advice?: string | null;
  follow_up_date?: string | null;
  completed_at: string | null;
  created_at: string;
}
  /* ================================
    COMPONENTS
  ================================= */

const DoctorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [availability, setAvailability] = useState(false);
  const [loading, setLoading] = useState(true);

  const [selectedConsultation, setSelectedConsultation] =
    useState<Consultation | null>(null);
  const [notes, setNotes] = useState("");
  const [advice, setAdvice] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [medicines, setMedicines] = useState<MedicineItem[]>([
    { name: "", dosage: "", frequency: "", duration: "" }
  ]);
  const [complaints, setComplaints] = useState<string[]>([""]);
  const [diagnosisList, setDiagnosisList] = useState<string[]>([""]);
  /* ================================
     FETCH PROFILE
  ================================= */

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("is_available")
        .eq("id", user.id)
        .maybeSingle();

      if (data) setAvailability(data.is_available ?? false);
    };

    fetchProfile();
  }, [user]);

  /* ================================
     FETCH CONSULTATIONS
  ================================= */

  const fetchConsultations = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from("consultation_requests")
      .select("*")
      .eq("doctor_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setConsultations(data as Consultation[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchConsultations();
  }, [fetchConsultations]);

  /* ================================
     REALTIME LISTENER
  ================================= */

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("doctor_consultation_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "consultation_requests",
        },
        fetchConsultations
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConsultations]);

  /* ================================
     TOGGLE AVAILABILITY
  ================================= */

  const toggleAvailability = async () => {
    const newValue = !availability;
    setAvailability(newValue);

    await supabase
      .from("profiles")
      .update({ is_available: newValue })
      .eq("id", user?.id);
  };

  /* ================================
     START CONSULTATION
  ================================= */

  const startConsultation = async (id: string) => {
    await supabase
      .from("consultation_requests")
      .update({ status: "ACTIVE" })
      .eq("id", id);

    fetchConsultations();
  };

  /* ================================
     OPEN COMPLETE MODAL
  ================================= */

const openCompleteModal = (consultation: Consultation) => {  
  setSelectedConsultation(consultation);  
  setNotes("");  
  setAdvice("");  
  setFollowUpDate("");  
  setMedicines([{ name: "", dosage: "", frequency: "", duration: "" }]);  

  // NEW
  setComplaints([""]);
  setDiagnosisList([""]);
};
  
  /* ================================
     FINAL COMPLETE
  ================================= */

const finalizeConsultation = async () => {
  if (!selectedConsultation) return;

  try {
    /* 1️⃣ Update consultation header */
    const { error } = await supabase
      .from("consultation_requests")
      .update({  
        status: "COMPLETED",  
        doctor_notes: notes,
      
        chief_complaints: complaints
          .filter(c => c.trim() !== "")
          .join(", "),
      
        diagnosis: diagnosisList
          .filter(d => d.trim() !== "")
          .join(", "),
      
        advice: advice,
        follow_up_date: followUpDate || null,
        completed_at: new Date().toISOString(),  
      })
      .eq("id", selectedConsultation.id);

    if (error) {
      console.error(error);
      return;
    }

/* 3 DELETE OLD MEDICINES (IMPORTANT) */
    await supabase
      .from("consultation_medicines")
      .delete()
      .eq("consultation_id", selectedConsultation.id);

    
    
    /* 2️⃣ Insert medicines into consultation_medicines table */
    const validMedicines = medicines.filter(
      (m) => m.name && m.dosage && m.frequency && m.duration
    );

    if (validMedicines.length > 0) {
      const formatted = validMedicines.map((med) => ({
        consultation_id: selectedConsultation.id,
        medicine_name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
      }));

      await supabase
        .from("consultation_medicines")
        .insert(formatted);
    }

    setSelectedConsultation(null);
    fetchConsultations();
  } catch (err) {
    console.error(err);
  }
};

  /* ================================
     BADGES
  ================================= */

  const riskBadge = (risk: string) => {
    if (risk === "RED")
      return <Badge className="bg-red-500 text-white">HIGH</Badge>;
    if (risk === "YELLOW")
      return <Badge className="bg-yellow-400 text-black">MODERATE</Badge>;
    return <Badge className="bg-green-500 text-white">LOW</Badge>;
  };

  const statusBadge = (status: string) => {
    if (status === "PENDING")
      return <Badge variant="secondary">Pending</Badge>;
    if (status === "ACTIVE")
      return <Badge className="bg-blue-500 text-white">Active</Badge>;
    return <Badge className="bg-gray-500 text-white">Completed</Badge>;
  };

  const activeConsultations = consultations.filter(
    (c) => c.status !== "COMPLETED"
  );

  const completedConsultations = consultations.filter(
    (c) => c.status === "COMPLETED"
  );

  /* ================================
     UI
  ================================= */

  return (
    <div className="min-h-screen bg-background p-6 space-y-10">

      <h1 className="text-3xl font-bold">Doctor Dashboard</h1>

      {/* Availability */}
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <p className="font-semibold">
            {availability ? "🟢 Online" : "🔴 Offline"}
          </p>
          <Switch checked={availability} onCheckedChange={toggleAvailability} />
        </CardContent>
      </Card>

      {/* ACTIVE CONSULTATIONS */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Active / Pending Consultations
        </h2>

        {loading && <p>Loading...</p>}

        {activeConsultations.length === 0 && (
          <p className="text-muted-foreground">
            No active consultations.
          </p>
        )}

        {activeConsultations.map((c) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="mb-4 hover:shadow-xl transition-all border">
              <CardContent className="p-6 space-y-4">

                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">
                      Session: {c.session_id}
                    </p>
                    {riskBadge(c.risk_level)}
                  </div>
                  {statusBadge(c.status)}
                </div>

                <div className="flex gap-2 flex-wrap">

                  {c.status === "PENDING" && (
                    <Button onClick={() => startConsultation(c.id)}>
                      Start Consultation
                    </Button>
                  )}

                  {c.status === "ACTIVE" && (
                    <Button
                      variant="secondary"
                      onClick={() => openCompleteModal(c)}
                    >
                      Complete & Add Prescription
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    onClick={() => navigate(`/report/${c.session_id}`)}
                  >
                    View Patient Report
                  </Button>

                </div>

              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* COMPLETED */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Completed Consultations
        </h2>

        {completedConsultations.length === 0 && (
          <p className="text-muted-foreground">
            No completed consultations.
          </p>
        )}

        {completedConsultations.map((c) => (
          <Card key={c.id} className="mb-4 border opacity-90">
            <CardContent className="p-6 space-y-3">

              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">
                    Session: {c.session_id}
                  </p>
                  {riskBadge(c.risk_level)}
                </div>
                {statusBadge(c.status)}
              </div>

              {c.doctor_notes && (
                <p className="text-sm">
                  <strong>Notes:</strong> {c.doctor_notes}
                </p>
              )}

              
                       
              {c.completed_at && (
                <p className="text-xs text-muted-foreground">
                  Completed on: {new Date(c.completed_at).toLocaleString()}
                </p>
              )}

            </CardContent>
          </Card>
        ))}
      </div>

      {/* MODAL */}
      {selectedConsultation && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
         <div className="bg-background border border-border p-6 rounded-xl w-full max-w-xl max-h-[85vh] overflow-y-auto space-y-4">
            <h2 className="text-xl font-bold">
              Add Consultation Notes & Prescription
            </h2>

          <textarea
            placeholder="Doctor Notes"
            className="w-full bg-background text-foreground border border-border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
           <h3 className="font-semibold mt-4">Chief Complaints</h3>

            {complaints.map((item, index) => (
              <input
                key={index}
                className="w-full p-3 rounded-lg bg-background border border-border text-foreground mb-2"
                placeholder={`Complaint ${index + 1}`}
                value={item}
                onChange={(e) => {
                  const updated = [...complaints];
                  updated[index] = e.target.value;
                  setComplaints(updated);
                }}
              />
            ))}
            
            <Button
              variant="outline"
              onClick={() => setComplaints([...complaints, ""])}
            >
              + Add Complaint
            </Button>

            <h3 className="font-semibold mt-4">Diagnosis</h3>
            
            {diagnosisList.map((item, index) => (
              <input
                key={index}
                className="w-full p-3 rounded-lg bg-background border border-border text-foreground mb-2"
                placeholder={`Diagnosis ${index + 1}`}
                value={item}
                onChange={(e) => {
                  const updated = [...diagnosisList];
                  updated[index] = e.target.value;
                  setDiagnosisList(updated);
                }}
              />
            ))}
            
            <Button
              variant="outline"
              onClick={() => setDiagnosisList([...diagnosisList, ""])}
            >
              + Add Diagnosis
            </Button>
           
            <textarea
              placeholder="Advice"
              className="w-full bg-background border border-border p-3 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              value={advice}
              onChange={(e) => setAdvice(e.target.value)}
            />
            
            <input
              type="date"
              className="w-full bg-background border border-border p-3 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
            />
            
          {medicines.map((med, index) => (
          <div key={index} className="grid grid-cols-2 gap-2">
            <input
              className="p-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Medicine Name"
              value={med.name}
              onChange={(e) => {
                const updated = [...medicines];
                updated[index].name = e.target.value;
                setMedicines(updated);
              }}
            />
            <input
              className="p-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Dosage (e.g. 500mg)"
              value={med.dosage}
              onChange={(e) => {
                const updated = [...medicines];
                updated[index].dosage = e.target.value;
                setMedicines(updated);
              }}
            />
            <input
              className="p-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Frequency (e.g. 1 Morning)"
              value={med.frequency}
              onChange={(e) => {
                const updated = [...medicines];
                updated[index].frequency = e.target.value;
                setMedicines(updated);
              }}
            />
            <input
              className="p-3 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Duration (e.g. 5 Days)"
              value={med.duration}
              onChange={(e) => {
                const updated = [...medicines];
                updated[index].duration = e.target.value;
                setMedicines(updated);
              }}
            />
          </div>
        ))}
        
        <Button
          variant="outline"
          onClick={() =>
            setMedicines([
              ...medicines,
              { name: "", dosage: "", frequency: "", duration: "" },
            ])
          }
        >
          + Add Another Medicine
        </Button>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedConsultation(null)}
              >
                Cancel
              </Button>
              <Button onClick={finalizeConsultation}>
                Finalize & Complete
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default DoctorDashboard;






