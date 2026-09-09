import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, User, MapPin, Bell, BellOff, Save, CheckCircle2, Loader2, Mail, Home, DollarSign, Scale, Users, Shield, Settings, TrendingUp, Calendar } from 'lucide-react';

interface UserProfileProps {
  onBack: () => void;
  onNavigate: (section: string) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onBack, onNavigate }) => {
  const { user, profile, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [notifyMaintenance, setNotifyMaintenance] = useState(true);
  const [notifyBills, setNotifyBills] = useState(true);
  const [notifyCommunity, setNotifyCommunity] = useState(true);
  const [notifyLegal, setNotifyLegal] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'stats'>('profile');

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setNeighborhood(profile.neighborhood || '');
      setNotifyMaintenance(profile.notify_maintenance);
      setNotifyBills(profile.notify_bills);
      setNotifyCommunity(profile.notify_community);
      setNotifyLegal(profile.notify_legal);
      setNotifyEmail(profile.notify_email);
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({
      display_name: displayName,
      neighborhood,
      notify_maintenance: notifyMaintenance,
      notify_bills: notifyBills,
      notify_community: notifyCommunity,
      notify_legal: notifyLegal,
      notify_email: notifyEmail,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!user || !profile) {
    return (
      <div className="text-center py-20">
        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-400">Please sign in</h2>
        <p className="text-gray-400 mt-2">You need to be signed in to view your profile.</p>
      </div>
    );
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'long', year: 'numeric'
  });

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>

      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-6 md:p-8 mb-8 text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-black">
            {(profile.display_name || user.email || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-black">{profile.display_name || 'User'}</h2>
            <p className="text-blue-200 mt-1">{user.email}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-blue-200">
              {profile.neighborhood && (
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {profile.neighborhood}</span>
              )}
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Member since {memberSince}</span>
            </div>
          </div>
          <button
            onClick={() => onNavigate('dashboard')}
            className="px-5 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl font-semibold text-sm transition-colors"
          >
            View Dashboard
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {[
          { key: 'profile', label: 'Profile', icon: User },
          { key: 'notifications', label: 'Notifications', icon: Bell },
          { key: 'stats', label: 'My Stats', icon: TrendingUp },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-blue-50 border border-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" /> Account Settings
          </h3>
          <div className="space-y-6 max-w-lg">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Display Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Neighborhood / Location</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="e.g., Riverside, Austin TX"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Used for community features and local resources</p>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : saved ? (
                <><CheckCircle2 className="w-4 h-4" /> Saved!</>
              ) : (
                <><Save className="w-4 h-4" /> Save Changes</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" /> Notification Preferences
          </h3>
          <div className="space-y-4 max-w-lg">
            {[
              { key: 'maintenance', label: 'Home Maintenance Reminders', desc: 'Seasonal maintenance tasks, filter changes, and safety checks', icon: Home, color: 'text-blue-600', value: notifyMaintenance, setter: setNotifyMaintenance },
              { key: 'bills', label: 'Bill & Money Alerts', desc: 'Bill due dates, dispute status updates, and savings opportunities', icon: DollarSign, color: 'text-emerald-600', value: notifyBills, setter: setNotifyBills },
              { key: 'legal', label: 'Resolve Updates', desc: 'Filing deadlines, document status, and new legal resources', icon: Scale, color: 'text-amber-600', value: notifyLegal, setter: setNotifyLegal },
              { key: 'community', label: 'Community Alerts', desc: 'Neighborhood incidents, new resources, and community events', icon: Users, color: 'text-orange-600', value: notifyCommunity, setter: setNotifyCommunity },
              { key: 'email', label: 'Email Notifications', desc: 'Receive important updates via email in addition to in-app', icon: Mail, color: 'text-gray-600', value: notifyEmail, setter: setNotifyEmail },
            ].map(item => (
              <div key={item.key} className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className={`w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center ${item.color} flex-shrink-0`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm">{item.label}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
                <button
                  onClick={() => item.setter(!item.value)}
                  className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${
                    item.value ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${
                    item.value ? 'translate-x-5.5 left-0' : 'translate-x-0.5'
                  }`} style={{ left: item.value ? '2px' : '2px', transform: item.value ? 'translateX(20px)' : 'translateX(0)' }} />
                </button>
              </div>
            ))}

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-60 mt-4"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : saved ? (
                <><CheckCircle2 className="w-4 h-4" /> Saved!</>
              ) : (
                <><Save className="w-4 h-4" /> Save Preferences</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div>
          {/* Pillar Progress */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { key: 'home', label: 'Home', icon: Home, progress: profile.home_progress, color: 'bg-blue-600', gradient: 'from-blue-500 to-blue-700' },
              { key: 'money', label: 'Money', icon: DollarSign, progress: profile.money_progress, color: 'bg-emerald-600', gradient: 'from-emerald-500 to-emerald-700' },
              { key: 'rights', label: 'Resolve', icon: Scale, progress: profile.rights_progress, color: 'bg-amber-600', gradient: 'from-amber-500 to-amber-700' },
              { key: 'community', label: 'Community', icon: Users, progress: profile.community_progress, color: 'bg-orange-600', gradient: 'from-orange-500 to-orange-700' },
            ].map(p => (
              <div key={p.key} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${p.gradient} flex items-center justify-center`}>
                    <p.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-2xl font-black text-gray-900">{p.progress}%</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">{p.label}</h4>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`${p.color} h-2 rounded-full transition-all duration-700`} style={{ width: `${p.progress}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Impact Numbers */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 text-white">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" /> Your Impact
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              <div className="text-center">
                <div className="text-2xl font-black text-blue-400">${profile.total_saved || 0}</div>
                <div className="text-xs text-gray-400 mt-1">Saved on repairs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-emerald-400">${profile.total_recovered || 0}</div>
                <div className="text-xs text-gray-400 mt-1">Recovered</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-cyan-400">{profile.guides_completed || 0}</div>
                <div className="text-xs text-gray-400 mt-1">Guides done</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-green-400">{profile.disputes_filed || 0}</div>
                <div className="text-xs text-gray-400 mt-1">Disputes filed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-amber-400">{profile.legal_actions || 0}</div>
                <div className="text-xs text-gray-400 mt-1">Resolve actions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-orange-400">{profile.neighbors_helped || 0}</div>
                <div className="text-xs text-gray-400 mt-1">Neighbors helped</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
