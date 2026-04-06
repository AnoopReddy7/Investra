
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ShieldCheck, TrendingUp, Cpu } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-slate-50 overflow-x-hidden">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-6 py-5 max-w-7xl mx-auto w-full">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/50">I</div>
          <span className="text-xl font-bold tracking-tight">INVESTRA</span>
        </div>
        <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
          <a href="#" className="hover:text-white transition-colors">My Data</a>
          <a href="#" className="hover:text-white transition-colors">Financial Path</a>
          <a href="#" className="hover:text-white transition-colors">Stocks</a>
          <a href="#" className="hover:text-white transition-colors">AI Assistant</a>
        </div>
        <div className="flex items-center space-x-4">
           <button onClick={() => navigate('/auth?mode=signin')} className="text-sm font-medium hover:text-white text-slate-300">Sign In</button>
           <button onClick={() => navigate('/auth?mode=signup')} className="bg-primary hover:bg-violet-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-lg shadow-primary/25">Sign Up</button>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative pt-20 pb-32 flex flex-col items-center text-center px-4">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] -z-10"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[128px] -z-10"></div>

        <div className="inline-flex items-center space-x-2 bg-slate-800/50 border border-slate-700/50 rounded-full px-4 py-1.5 mb-8 backdrop-blur-sm">
          <Cpu size={14} className="text-primary" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Driven by Agentic AI Intelligence</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">INVESTRA</span>
        </h1>
        
        <p className="text-2xl md:text-3xl text-primary font-medium mb-4">Your Intelligent Financial Companion</p>
        <p className="text-lg text-slate-400 max-w-2xl mb-10 leading-relaxed">
          Intelligent financial management that automatically optimizes your budget and grows your wealth through smart micro-investments and PDF statement analysis.
        </p>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <button onClick={() => navigate('/auth?mode=signup')} className="group flex items-center justify-center space-x-2 bg-primary hover:bg-violet-700 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-xl shadow-primary/30">
            <span>Get Started Free</span>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-xl text-lg font-medium border border-slate-700 transition-all">
            <CheckCircle2 size={20} className="text-slate-400" />
            <span>Learn More</span>
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <div className="inline-block px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm font-medium mb-4">Powerful Features</div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Complete AI Financial Management Suite</h2>
          <p className="text-slate-400">Agentic AI platform that automates budgeting and investing for optimal wealth growth.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
           <FeatureCard 
             icon={<TrendingUp className="text-white" size={24} />}
             color="bg-emerald-500"
             title="Goal-Based Planning"
             desc="Personalized financial roadmaps for homes, cars, education with adaptive tracking."
           />
           <FeatureCard 
             icon={<ShieldCheck className="text-white" size={24} />}
             color="bg-blue-500"
             title="Scenario Forecasting"
             desc="Predictive analytics to assess financial futures and risks using advanced AI."
           />
           <FeatureCard 
             icon={<Cpu className="text-white" size={24} />}
             color="bg-primary"
             title="Smart Budget Structuring"
             desc="AI-driven fund allocation for expenses, savings, and goals with real-time optimization."
           />
           <FeatureCard 
             icon={<ArrowRight className="text-white" size={24} />}
             color="bg-orange-500"
             title="Automated Micro-Investing"
             desc="Instant surplus fund investment into diversified, high-ROI portfolios."
           />
        </div>
      </div>
      
      {/* Footer mock */}
      <footer className="border-t border-slate-800 py-10 mt-20 text-center text-slate-500 text-sm">
        <p>© 2024 Investra. All rights reserved.</p>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, color, title, desc }: { icon: React.ReactNode, color: string, title: string, desc: string }) => (
  <div className="bg-surface border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600 transition-all hover:shadow-2xl hover:shadow-primary/5 group">
    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-6 shadow-lg`}>
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3 text-slate-100 group-hover:text-primary transition-colors">{title}</h3>
    <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
  </div>
);

export default LandingPage;
