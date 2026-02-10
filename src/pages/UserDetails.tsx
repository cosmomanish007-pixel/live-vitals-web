import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWifiSession } from '@/hooks/useWifiSession';
import type { Gender, SessionMode } from '@/types/database';
import { Stethoscope } from 'lucide-react';

const UserDetails = () => {
  const [userName, setUserName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender>('Male');
  const [mode, setMode] = useState<SessionMode>('Self');
  const [loading, setLoading] = useState(false);
  const { startSession } = useWifiSession();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const session = await startSession({
      userName,
      age: parseInt(age),
      gender,
      mode,
    });

    if (session) {
      navigate(`/monitor/${session.id}`);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="mb-6 flex flex-col items-center gap-2">
          <Stethoscope className="h-8 w-8 text-primary" />
          <h1 className="text-lg font-bold text-foreground">New Monitoring Session</h1>
          <p className="text-sm text-muted-foreground">Enter patient details</p>
        </div>

        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Patient Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Patient name"
                  required
                  className="bg-secondary/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min={1}
                  max={150}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Age"
                  required
                  className="bg-secondary/50"
                />
              </div>

              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
                  <SelectTrigger className="bg-secondary/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Mode</Label>
                <RadioGroup value={mode} onValueChange={(v) => setMode(v as SessionMode)} className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="Self" id="self" />
                    <Label htmlFor="self" className="font-normal cursor-pointer">Self</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="Assisted" id="assisted" />
                    <Label htmlFor="assisted" className="font-normal cursor-pointer">Assisted</Label>
                  </div>
                </RadioGroup>
              </div>

              <Button type="submit" className="w-full h-11 font-semibold mt-2" disabled={loading}>
                {loading ? 'Creating Session...' : 'Start Session'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default UserDetails;
