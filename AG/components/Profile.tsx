
import React, { useEffect, useState, useRef } from 'react';
import { User, Shield, Bell, User as UserIcon, LogOut, CheckCircle2, Upload, Loader2, FileText, Camera } from 'lucide-react';
import { apiService } from '../services/apiService';
import { UserProfile, BankStatementMetadata } from '../types';
import { storageService } from '../services/storageService';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'Personal Info'>('Personal Info');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [statement, setStatement] = useState<BankStatementMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Inputs for Personal Info
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    location: '',
    email: '',
    dob: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      const [profileData, statementData] = await Promise.all([
        apiService.getUserProfile(),
        apiService.getBankStatement()
      ]);
      setProfile(profileData);
      setStatement(statementData);
      setFormData({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
        location: profileData.location,
        email: profileData.email,
        dob: profileData.dob
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    await apiService.updateUserProfile(formData);
    setSaving(false);
    // Reload to confirm data
    fetchData();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      try {
        const newStatement = await apiService.uploadBankStatement(file);
        setStatement(newStatement);
        
        // Refresh profile to get the updated balance
        const updatedProfile = await apiService.getUserProfile();
        setProfile(updatedProfile);
      } catch (error) {
        console.error("Upload failed:", error);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleLogout = () => {
    storageService.logout();
    navigate('/auth');
  };

  if (loading) return <div className="h-full flex items-center justify-center text-primary"><Loader2 className="animate-spin" size={40} /></div>;

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-100px)]">
      {/* Sidebar Tabs */}
      <div className="w-full lg:w-64 flex flex-col space-y-2">
        <button 
          onClick={() => setActiveTab('Personal Info')}
          className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'Personal Info' ? 'bg-primary/20 text-primary border-l-4 border-primary' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
        >
          <UserIcon size={20} />
          <span className="font-medium">Personal Info</span>
        </button>
        
        <div className="pt-4 mt-auto">
          <button onClick={handleLogout} className="flex items-center space-x-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors w-full">
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-surface border border-slate-700 rounded-2xl p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-8">{activeTab}</h2>

        <div className="space-y-8">
          {/* Avatar Section */}
          <div className="flex justify-center mb-8">
            <div className="relative group cursor-pointer">
              <div className="w-24 h-24 rounded-full bg-emerald-600 flex items-center justify-center text-4xl text-white font-bold">
                {profile?.firstName?.charAt(0) || 'U'}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white" size={24} />
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-slate-400 mb-1">First Name</label>
              <input 
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                type="text" 
                className="w-full bg-background border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Phone Number</label>
              <input 
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                type="tel" 
                className="w-full bg-background border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Last Name</label>
              <input 
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                type="text" 
                className="w-full bg-background border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Location</label>
              <input 
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                type="text" 
                placeholder="City, Country"
                className="w-full bg-background border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Email</label>
              <input 
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                type="email" 
                className="w-full bg-background border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Date of Birth</label>
              <input 
                name="dob"
                value={formData.dob}
                onChange={handleInputChange}
                type="date" 
                className="w-full bg-background border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>

          {/* Bank Statement Section */}
          <div className="mt-8">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <FileText className="mr-2 text-primary" size={20} /> Bank Statement
            </h3>
            
            {/* Green Info Box */}
            <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="text-emerald-500 mt-0.5" size={20} />
                  <div>
                      <p className="text-emerald-400 font-medium text-sm">
                        Current Statement: <span className="text-white font-bold">{statement?.fileName || 'No file uploaded'}</span>
                      </p>
                      <p className="text-xs text-emerald-500/80 mt-1">Your portfolio data is being calculated from this statement</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <button className="text-emerald-400 hover:text-emerald-300 font-medium">View</button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-emerald-400 hover:text-emerald-300 font-medium"
                  >
                    Change File
                  </button>
                </div>
            </div>

            {/* Upload Area */}
            <div className="mt-4 p-6 border-2 border-dashed border-slate-700 rounded-xl bg-background/50 hover:bg-background transition-colors text-center">
                <p className="text-slate-400 text-sm mb-4">Upload a new bank statement to update your portfolio analysis. Your wealth will be calculated from the closing balance.</p>
                
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf"
                  className="hidden"
                />
                
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-2 text-slate-300 border border-slate-600 px-4 py-2 rounded-lg hover:border-slate-400 transition-colors"
                  >
                    <Upload size={16} />
                    <span>Choose PDF file (Max 5MB)</span>
                  </button>
                  <button 
                    disabled={uploading}
                    className="bg-slate-200 text-slate-900 font-bold px-6 py-2 rounded-lg hover:bg-white transition-colors disabled:opacity-50"
                  >
                    {uploading ? 'Analyzing...' : 'Upload & Analyze'}
                  </button>
                </div>
            </div>
          </div>

          <div className="flex justify-end pt-6">
              <button 
                onClick={handleSave}
                disabled={saving}
                className="bg-primary hover:bg-violet-600 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-primary/25 flex items-center"
              >
                {saving && <Loader2 className="animate-spin mr-2" size={18} />}
                Save Changes
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
