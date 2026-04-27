import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { useToast } from '../../components/ui/use-toast';
import { Mail, Lock, ArrowRight } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { setAuth, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // If already logged in, redirect to respective dashboard
  if (isAuthenticated && user) {
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'TEACHER') return <Navigate to="/teacher/quizzes" replace />;
    if (user.role === 'STUDENT') return <Navigate to="/student/dashboard" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      
      const { user: userData, accessToken } = response.data;
      setAuth(userData, accessToken);

      toast({
        title: 'Welcome back!',
        description: `Logged in as ${userData.name}`,
        variant: 'success',
      });

      if (userData.role === 'ADMIN') navigate('/admin/dashboard');
      else if (userData.role === 'TEACHER') navigate('/teacher/quizzes');
      else if (userData.role === 'STUDENT') navigate('/student/dashboard');

    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error.response?.data?.error || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans selection:bg-primary/20">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex flex-1 relative bg-primary overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute top-40 -right-20 w-80 h-80 bg-accent rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 left-20 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
        
        <div className="relative z-10 text-white p-12 max-w-lg text-center">
          <div className="mb-8 inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-16 h-16 drop-shadow-md">
              <path d="M32 12 L18 22 L18 38 L32 48 L46 38 L46 22 Z" fill="none" stroke="white" strokeWidth="3" strokeLinejoin="round"/>
              <path d="M32 18 L22 25 L22 35 L32 42 L42 35 L42 25 Z" fill="#F97316" />
            </svg>
          </div>
          <h1 className="text-5xl font-black mb-6 tracking-tight">WBES <span className="text-accent">Web-Based Exam System</span></h1>
          <p className="text-lg text-blue-100/80 font-medium leading-relaxed">
            The next-generation secure examination platform. Featuring anti-cheat technology, real-time sync, and powerful analytics.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        {/* Mobile Background Elements */}
        <div className="absolute inset-0 bg-gradient-hero lg:hidden -z-10"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 lg:hidden -z-10"></div>
        
        <div className="w-full max-w-md animate-fade-in relative z-10">
          <div className="bg-white/95 lg:bg-white backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 p-8 sm:p-10">
            <div className="text-center mb-10">
              <div className="lg:hidden mb-6 flex justify-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-800 flex items-center justify-center shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-10 h-10">
                    <path d="M32 12 L18 22 L18 38 L32 48 L46 38 L46 22 Z" fill="none" stroke="white" strokeWidth="3" strokeLinejoin="round"/>
                    <path d="M32 18 L22 25 L22 35 L32 42 L42 35 L42 25 Z" fill="#F97316" />
                  </svg>
                </div>
              </div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Welcome Back</h2>
              <p className="text-slate-500 font-medium mt-2">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2 text-left">
                <Label htmlFor="email" className="text-sm font-bold text-slate-700">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-12 h-12 bg-slate-50 border-slate-200 focus:bg-white rounded-xl transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2 text-left">
                <Label htmlFor="password" className="text-sm font-bold text-slate-700">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-12 h-12 bg-slate-50 border-slate-200 focus:bg-white rounded-xl transition-all"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-0.5" 
                disabled={isLoading}
              >
                {isLoading ? 'Authenticating...' : 'Sign In to Dashboard'}
                {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
              </Button>
            </form>
            
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-sm font-medium text-slate-500">
                Don't have an account? <span className="text-primary cursor-pointer hover:underline">Contact Administrator</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
