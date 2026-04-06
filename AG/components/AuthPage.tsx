
import React, { useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Loader2, AlertCircle, Upload, FileText, CheckCircle2, ArrowRight, UserPlus, LogIn } from 'lucide-react';
import { User } from '../types';
import { storageService } from '../services/storageService';
import { analyzeBankStatement } from '../services/geminiService';

interface AuthPageProps {
  onLogin: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isLoginMode = searchParams.get('mode') !== 'signup';
  
  const [isLogin, setIsLogin] = useState(isLoginMode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [signupStep, setSignupStep] = useState(1); // 1: Details, 2: Statement Upload
  
  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // File State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleStepOne = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const normalizedEmail = email.trim().toLowerCase();

    if (!fullName.trim() && !isLogin) {
      setError('Please enter your full name.');
      return;
    }

    if (!validateEmail(normalizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Confirm Password must exactly match Password.');
      return;
    }

    const accounts = storageService.getAccounts();
    const emailExists = accounts.some(acc => acc.email === normalizedEmail);

    if (!isLogin && emailExists) {
      setError('This email is already registered. Please sign in.');
      return;
    }

    if (isLogin) {
      handleSignIn(normalizedEmail);
    } else {
      setSignupStep(2);
    }
  };

  const handleSignIn = async (normalizedEmail: string) => {
    setIsLoading(true);
    try {
      const accounts = storageService.getAccounts();
      const account = accounts.find(acc => acc.email === normalizedEmail);
      
      if (!account) {
        throw new Error("No account found with this email. Please sign up.");
      }

      if (account.password !== password) {
        throw new Error("Incorrect password.");
      }

      setTimeout(() => {
        onLogin(account.user);
      }, 800);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
        setError('Please upload a PDF or an image of your bank statement.');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleFinalSignup = async () => {
    if (!selectedFile) {
      setError('Please upload your bank statement to proceed.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 1. Convert file to base64
      const reader = new FileReader();
      const fileDataPromise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(selectedFile);
      });

      const base64Data = await fileDataPromise;
      
      // 2. Analyze with AI
      const analysis = await analyzeBankStatement(base64Data, selectedFile.type);
      
      // 3. Create Account
      const normalizedEmail = email.trim().toLowerCase();
      const newUser: User = {
        id: crypto.randomUUID(),
        fullName: fullName.trim(),
        email: normalizedEmail,
        phone: '', 
        balance: analysis.balance,
        bankStatementName: selectedFile.name,
        lastUpdated: new Date().toISOString()
      };

      const accounts = storageService.getAccounts();
      const updatedAccounts = [...accounts, { 
        email: normalizedEmail, 
        password, 
        user: newUser 
      }];
      
      storageService.saveAccounts(updatedAccounts);

      setTimeout(() => {
        onLogin(newUser);
      }, 800);
      
    } catch (err: any) {
      setError("AI analysis failed or network error. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Blur */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="bg-surface border border-slate-700 rounded-3xl shadow-2xl w-full max-w-lg p-8 md:p-10 relative z-10 backdrop-blur-xl bg-opacity-80">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-primary to-violet-400 rounded-2xl text-white font-bold text-3xl mb-4 shadow-xl shadow-primary/30">
            I
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            {isLogin ? 'Welcome Back' : signupStep === 1 ? 'Join INVESTRA' : 'Initialize Your Wealth'}
          </h2>
          <p className="text-slate-400 mt-2 font-medium">
            {isLogin 
              ? 'Securely access your financial dashboard' 
              : signupStep === 1 
                ? 'Create your unique investor account' 
                : 'Upload a statement to track your progress'}
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 text-rose-400 p-4 rounded-2xl text-sm mb-6 flex items-start border border-rose-500/20 animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {isLogin || signupStep === 1 ? (
          <form onSubmit={handleStepOne} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5 ml-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="John Doe"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-5 py-3.5 text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder-slate-600"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5 ml-1">Email Address</label>
              <input 
                type="email" 
                required
                placeholder="name@example.com"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-5 py-3.5 text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder-slate-600"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5 ml-1">Password</label>
              <input 
                type="password" 
                required
                placeholder="••••••••"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-5 py-3.5 text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder-slate-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5 ml-1">Confirm Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-5 py-3.5 text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder-slate-600"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-primary hover:bg-violet-600 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-primary/30 mt-6 flex justify-center items-center disabled:opacity-50 group"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  {isLogin ? 'Signing In...' : 'Proceeding...'}
                </>
              ) : (
                <>
                  <span>{isLogin ? 'Sign In' : 'Next Step'}</span>
                  {!isLogin ? <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} /> : <LogIn className="ml-2" size={18} />}
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`p-10 border-2 border-dashed rounded-3xl cursor-pointer transition-all flex flex-col items-center text-center ${
                selectedFile ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-700 hover:border-primary bg-slate-800/30'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
                accept=".pdf,image/*" 
              />
              {selectedFile ? (
                <>
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <p className="text-white font-bold mb-1 truncate max-w-full px-4">{selectedFile.name}</p>
                  <p className="text-emerald-400 text-sm">Ready for AI analysis</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                    <Upload size={32} />
                  </div>
                  <p className="text-white font-bold mb-1">Click to upload statement</p>
                  <p className="text-slate-400 text-sm">PDF or Image (Max 5MB)</p>
                </>
              )}
            </div>

            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 flex items-start space-x-3">
              <div className="p-2 bg-primary/20 rounded-lg mt-0.5">
                <FileText className="text-primary" size={16} />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                <span className="text-slate-200 font-bold block mb-1">Why do we need this?</span>
                INVESTRA's Agentic AI analyzes your closing balance to provide accurate growth projections and tailored financial advice from day one.
              </p>
            </div>

            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => setSignupStep(1)}
                className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all border border-slate-700"
                disabled={isLoading}
              >
                Back
              </button>
              <button 
                onClick={handleFinalSignup}
                disabled={isLoading || !selectedFile}
                className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-emerald-500/20 flex justify-center items-center disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <span>Complete Signup</span>
                    <UserPlus className="ml-2" size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
        
        <div className="mt-8 text-center">
          <button 
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setSignupStep(1);
              setError('');
              setSelectedFile(null);
            }} 
            className="text-sm text-slate-400 hover:text-primary transition-colors font-semibold"
          >
            {isLogin ? "New to INVESTRA? Create an account" : "Already registered? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
