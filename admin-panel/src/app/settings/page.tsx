import { 
  Settings, 
  Bell, 
  Shield, 
  Users, 
  Globe, 
  Database,
  Lock,
  Mail,
  ChevronRight,
  Info,
  Smartphone,
  Server,
  Key
} from "lucide-react";

export default function SettingsPage() {
  const sections = [
    { 
      title: "General Settings", 
      items: [
        { label: "Clinic Verification Mode", value: "Strict Validation", icon: Shield, desc: "Require identity check and license verification for all new clinic accounts." },
        { label: "Community Feed Policy", value: "Moderated", icon: Lock, desc: "Control how posts are shared in the global feed." },
      ]
    },
    { 
      title: "Communication", 
      items: [
        { label: "Global Announcement Email", value: "support@furrcircle.com", icon: Mail, desc: "Default sender for all system-wide announcements." },
        { label: "Push Notification Alerts", value: "Enabled", icon: Bell, desc: "Enable automated alerts for medical reminders and upcoming events." },
      ]
    },
    { 
      title: "App Infrastructure", 
      items: [
        { label: "Storage Engine", value: "AWS S3 / Cloudinary", icon: Server, desc: "Current destination for pet and clinic image uploads." },
        { label: "API Rate Limiting", value: "1000 req / min", icon: Key, desc: "Individual user throttling rules for API access." },
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-950 uppercase tracking-tight">System Settings</h1>
        <p className="text-slate-500 mt-1">Manage global system configurations, security policies, and application infrastructure.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Settings Groups */}
        <div className="lg:col-span-2 space-y-6">
          {sections.map((section, idx) => (
            <div key={idx} className="bg-white rounded-card border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{section.title}</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {section.items.map((item, i) => (
                  <div key={i} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50/50 transition-colors gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-primary-50 rounded-lg shrink-0">
                        <item.icon size={20} className="text-primary-900" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-950">{item.label}</p>
                        <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-primary-900 bg-primary-900/5 px-2.5 py-1.5 rounded-lg border border-primary-900/10 min-w-[100px] text-center">
                        {item.value}
                      </span>
                      <button className="p-2 text-slate-400 hover:text-primary-900 transition-colors">
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column - System Info & Status */}
        <div className="space-y-6">
          <div className="bg-primary-900 rounded-card p-6 text-white shadow-lg shadow-primary-900/20">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Smartphone size={20} />
              App Version
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-white/10 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-white/50 tracking-widest mb-1">Current Release</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">v2.4.0 <span className="text-sm font-normal text-emerald-400 italic">Pre-production</span></span>
                  <button className="px-3 py-1 bg-white text-primary-900 text-[10px] font-bold rounded-lg uppercase tracking-wider">Update</button>
                </div>
              </div>
              <div className="p-4 bg-white/10 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-white/50 tracking-widest mb-1">API Status</p>
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-glow shadow-emerald-400/50"></div>
                  Operatinal & Healthy
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-card border border-slate-200 p-6 shadow-sm">
             <h3 className="font-bold text-slate-950 mb-4 flex items-center gap-2">
              <Database size={20} className="text-slate-400" />
              Recent Logs
            </h3>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="flex gap-3 py-2 border-b border-slate-50 last:border-0 hover:border-primary-100 transition-colors">
                  <div className="mt-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-bold text-slate-950 leading-tight">Clinic #84 verified by AD.</p>
                    <p className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter mt-1">2m ago • 192.168.1.1</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-input hover:bg-slate-200 transition-colors uppercase tracking-widest">
              View Audit Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
