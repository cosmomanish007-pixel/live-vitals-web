import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const ApplyDoctor = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [license, setLicense] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [hospital, setHospital] = useState("");
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    if (!user) return;

    setLoading(true);

    await supabase
      .from("profiles")
      .update({
        role: "doctor",
        doctor_status: "pending",
        license_number: license,
        specialization: specialization,
        hospital: hospital,
      })
      .eq("id", user.id);

    setLoading(false);
    alert("Application submitted. Await admin approval.");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-4 p-6">
          <h2 className="text-xl font-bold">Apply as Doctor</h2>

          <Input
            placeholder="Medical License Number"
            value={license}
            onChange={(e) => setLicense(e.target.value)}
          />

          <Input
            placeholder="Specialization"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
          />

          <Input
            placeholder="Hospital / Clinic"
            value={hospital}
            onChange={(e) => setHospital(e.target.value)}
          />

          <Button onClick={handleApply} disabled={loading} className="w-full">
            {loading ? "Submitting..." : "Submit Application"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApplyDoctor;