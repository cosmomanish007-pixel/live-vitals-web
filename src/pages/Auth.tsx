import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) setError(error.message);
      else navigate('/new-session');
    } else {
      const { error } = await signUp(email, password, fullName);
      if (error) setError(error.message);
      else setMessage('Check your email to confirm your account.');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="mb-6 flex flex-col items-center gap-2">
          <Heart className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-bold text-foreground">AURA-STETH AI</h1>
        </div>

        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">{isLogin ? 'Sign In' : 'Create Account'}</CardTitle>
            <CardDescription>
              {isLogin ? 'Enter your credentials to continue' : 'Sign up to start monitoring'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Dr. John Smith"
                    required={!isLogin}
                    className="bg-secondary/50"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="bg-secondary/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="bg-secondary/50"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
              {message && <p className="text-sm text-primary">{message}</p>}

              <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
                {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
              </Button>
            </form>

            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); setMessage(''); }}
              className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;
