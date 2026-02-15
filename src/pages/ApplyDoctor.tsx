import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const ApplyDoctor = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [license, setLicense] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [hospital, setHospital] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<
    "pending" | "approved" | "rejected" | null
  >(null);

  /* ===============================
     FETCH CURRENT STATUS
  ================================ */

  useEffect(() => {
    if (!user) return;

    const fetchStatus = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("doctor_status, role")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Status fetch error:", error);
        return;
      }

      if (!data) return;

      if (data.role === "doctor" && data.doctor_status === "pending") {
        setCurrentStatus("pending");
      } else if (data.role === "doctor" && data.doctor_status === "approved") {
        setCurrentStatus("approved");
      } else if (data.doctor_status === "rejected") {
        setCurrentStatus("rejected");
      } else {
        setCurrentStatus(null);
      }
    };

    fetchStatus();
  }, [user]);

  /* ===============================
     SAFE REDIRECT
  ================================ */

  useEffect(() => {
    if (currentStatus === "approved") {
      navigate("/doctor-dashboard");
    }
  }, [currentStatus, navigate]);

  /* ===============================
     HANDLE APPLY
  ================================ */

  const handleApply = async () => {
    if (!user) return;

    if (!fullName.trim() || !license.trim()) {
      alert("Full Name and License Number are required.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          role: "doctor",
          doctor_status: "pending",
          license_number: license.trim(),
          specialization: specialization.trim(),
          hospital: hospital.trim(),
        })
        .eq("id", user.id);

      if (error) throw error;

      alert("Application submitted. Await admin approval.");
      setCurrentStatus("pending");

    } catch (err: any) {
      console.error(err);
      alert(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     STATUS UI STATES
  ================================ */

  if (currentStatus === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-6 text-center">
          <p className="text-yellow-600 font-semibold">
            Your doctor application is pending approval.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            You will be notified once admin reviews your request.
          </p>
        </Card>
      </div>
    );
  }

  if (currentStatus === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-6 text-center">
          <p className="text-red-600 font-semibold">
            Your doctor application has been rejected.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            You are currently using the platform as a normal user.
          </p>
        </Card>
      </div>
    );
  }

  /* ===============================
     APPLICATION FORM
  ================================ */

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="space-y-4 p-6">

          <h2 className="text-xl font-bold text-center">
            Apply as Doctor
          </h2>

          <Input
            placeholder="Full Name (as per Medical License)"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

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

          <Button
            onClick={handleApply}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Submitting..." : "Submit Application"}
          </Button>

        </CardContent>
      </Card>
    </div>
  );
};

export default ApplyDoctor;
