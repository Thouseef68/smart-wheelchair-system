"use client";
import React, { useEffect, useState, useRef } from 'react';
import { auth, db } from '@/firebase';
import { signOut, updateEmail, updatePassword } from 'firebase/auth';
import { ref, onValue, set } from 'firebase/database';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, YAxis, CartesianGrid } from 'recharts';
import emailjs from '@emailjs/browser';

export default function DashboardScreen() {
  const [activeTab, setActiveTab] = useState('dash');
  const [userProfile, setUserProfile] = useState(null);
  const [chairData, setChairData] = useState(null);
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [sensitivity, setSensitivity] = useState(7.5);
  const [isOnline, setIsOnline] = useState(false);
  
  const escalationTimer = useRef(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      onValue(ref(db, `Wheel_Chair_Users/${user.uid}`), (snap) => {
        const data = snap.val();
        if (!data) return;
        setUserProfile(data);

        if (data?.linkedDevice) {
          onValue(ref(db, `Wheel_Chair/${data.linkedDevice}`), (cSnap) => {
            const chair = cSnap.val();
            if (!chair) return;
            setChairData(chair);
            
            if(chair.Settings?.Sensitivity) setSensitivity(chair.Settings.Sensitivity);
            setIsOnline(true);

            // EMERGENCY PROTOCOL
            if (chair?.Active_Alert?.Status === "FELL DOWN" && !isAcknowledged) {
              const msg = new SpeechSynthesisUtterance(`EMERGENCY: ${data.profile.name} HAS FALLEN!`);
              window.speechSynthesis.speak(msg);

              if (!escalationTimer.current) {
                escalationTimer.current = setTimeout(() => {
                  sendEmergencyEscalation(data, chair);
                }, 120000); // 2 Minutes
              }
            }
          });
        }
      });
    }
  }, [isAcknowledged]);

  const handleAcknowledge = async () => {
    window.speechSynthesis.cancel(); 
    if (escalationTimer.current) { clearTimeout(escalationTimer.current); escalationTimer.current = null; }
    setIsAcknowledged(true);
    await set(ref(db, `Wheel_Chair/${userProfile.linkedDevice}/Active_Alert/Status`), "SAFE");
  };

  const updateSensitivity = (val) => {
    setSensitivity(val);
    set(ref(db, `Wheel_Chair/${userProfile.linkedDevice}/Settings/Sensitivity`), parseFloat(val));
  };

  const triggerRemoteBuzzer = () => {
    set(ref(db, `Wheel_Chair/${userProfile.linkedDevice}/Commands/BuzzerTrigger`), true);
  };

const sendEmergencyEscalation = (profile, chair) => {
  const params = {
    patient_name: profile.profile.name,
    location: chair.Active_Alert.Google_Maps,
    phone: profile.profile.mobile,
    time: chair.Active_Alert.Time,
    to_email: profile.profile.email 
  };
  
  // Using Environment Variables instead of hardcoded strings
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

  for(let i=0; i<5; i++) {
    setTimeout(() => {
      emailjs.send(serviceId, templateId, params, publicKey);
    }, i * 3000);
  }
};

  if (!userProfile?.profile) return (
    <div className="h-screen flex items-center justify-center bg-slate-950 text-blue-500 font-mono animate-pulse tracking-[0.5em]">
      ESTABLISHING_VITAL_LINK...
    </div>
  );

  const logs = chairData?.Fall_Log ? Object.values(chairData.Fall_Log) : [];

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20 font-sans relative overflow-hidden">
      
      {/* 🟢 TOP STATUS HUD */}
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`}></span>
            <span className={isOnline ? 'text-emerald-400' : 'text-red-500'}>{isOnline ? 'System Online' : 'Link Lost'}</span>
          </div>
          <span className="text-blue-400">📶 {chairData?.Heartbeat?.Signal || -0} dBm</span>
          <span className="text-yellow-400">🔋 {Math.round(chairData?.Heartbeat?.Battery || 0)}% Energy</span>
        </div>
        <button onClick={triggerRemoteBuzzer} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full text-[9px] font-black transition-all">🔊 TRIGGER REMOTE SIREN</button>
      </div>

      {/* 3D NAVIGATION */}
      <div className="flex justify-center gap-6 md:gap-10 py-10 relative z-10">
        {[
          {id:'profile', icon:'👤', label:'PATIENT'},
          {id:'dash', icon:'♿', label:'DASHBOARD'},
          {id:'report', icon:'📊', label:'FORENSICS'}
        ].map(t => (
          <button key={t.id} onClick={() => {setActiveTab(t.id); setIsAcknowledged(false);}}
            className={`w-24 h-24 md:w-32 md:h-32 rounded-full flex flex-col items-center justify-center border-2 transition-all backdrop-blur-2xl
            ${activeTab === t.id ? 'bg-blue-600 scale-110 border-blue-400 shadow-blue-500/50' : 'bg-white/5 border-white/10'}`}>
            <span className="text-3xl mb-1">{t.icon}</span>
            <span className="text-[10px] font-black tracking-widest">{t.label}</span>
          </button>
        ))}
      </div>

      <main className="max-w-6xl mx-auto p-6 relative z-10 space-y-10">
        
        {activeTab === 'dash' && (
          <div className="animate-in zoom-in duration-500 space-y-10">
            <div className="text-center">
              <h1 className="text-7xl md:text-9xl font-black uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/20 leading-none">
                {userProfile.profile.name}
              </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {/* 🛠️ SENSITIVITY SLIDER */}
               <div className="bg-white/5 p-8 rounded-[3.5rem] border border-white/10 flex flex-col justify-center">
                  <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.5em] mb-8">Fall Threshold</h3>
                  <input type="range" min="3" max="15" step="0.5" value={sensitivity} onChange={(e) => updateSensitivity(e.target.value)} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"/>
                  <div className="flex justify-between mt-4 font-mono text-[9px] opacity-40">
                    <span>High (3.0)</span>
                    <span className="text-blue-400 font-bold text-sm">{sensitivity}</span>
                    <span>Low (15.0)</span>
                  </div>
               </div>

               {/* 🏥 COMPREHENSIVE VITALS */}
               <div className="bg-white/5 p-8 rounded-[3.5rem] border border-white/10">
                  <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.5em] mb-6">Medical Summary</h3>
                  <div className="space-y-4">
                    <p className="text-2xl font-black">{userProfile.profile.bp} BP | {userProfile.profile.heartRate} HR</p>
                    <p className="text-[11px] font-bold uppercase tracking-widest opacity-50">{userProfile.profile.age}Y • {userProfile.profile.weight}KG • {userProfile.profile.gender}</p>
                    <div className="border-t border-white/5 pt-4">
                       <p className="text-[10px] italic text-blue-300">"{userProfile.profile.cause}"</p>
                    </div>
                  </div>
               </div>

               {/* 🚨 INCIDENT HUB */}
               <div className={`p-8 rounded-[3.5rem] border-2 transition-all duration-700 ${chairData?.Active_Alert?.Status === "FELL DOWN" && !isAcknowledged ? 'bg-red-500/20 border-red-500 animate-pulse' : 'bg-white/5 border-white/10'}`}>
                  <h3 className="text-[10px] font-black uppercase opacity-40 mb-4 tracking-widest">Incident Alert</h3>
                  <p className="text-4xl font-black uppercase mb-2 tracking-tight">{chairData?.Active_Alert?.Status || "SCANNING"}</p>
                  
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5 mb-6 text-[10px] font-mono">
                     <p className="text-blue-400 mb-1">⏰ {chairData?.Active_Alert?.Time || "--:--:--"}</p>
                     <p className="opacity-60">📅 {chairData?.Active_Alert?.Day || "N/A"}, {chairData?.Active_Alert?.Date || "00-00-0000"}</p>
                  </div>

                  <div className="flex gap-3">
                    {chairData?.Active_Alert?.Status === "FELL DOWN" && !isAcknowledged && (
                      <button onClick={handleAcknowledge} className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black text-[10px] shadow-xl">✓ ACKNOWLEDGE</button>
                    )}
                    <a href={chairData?.Active_Alert?.Google_Maps} target="_blank" className="bg-white/10 px-6 py-3 rounded-2xl text-[10px] font-black uppercase border border-white/10">📍 MAP</a>
                  </div>
                  {chairData?.Active_Alert?.Status === "FELL DOWN" && !isAcknowledged && (
                    <p className="text-[9px] text-red-500 font-mono mt-4 animate-bounce text-center uppercase font-black">2-Minute Auto-Escalation Active</p>
                  )}
               </div>
            </div>

            {/* 🗺️ LIVE MAP EMBED */}
            <div className="bg-white/5 rounded-[4rem] border border-white/10 overflow-hidden h-[450px] relative shadow-2xl">
               <div className="absolute top-6 left-6 z-20 bg-slate-900/90 px-5 py-2 rounded-full border border-blue-500/30 text-[9px] font-black uppercase tracking-widest text-emerald-400">📡 Global Positioning Intercept</div>
               <iframe 
                width="100%" 
                height="100%" 
                frameBorder="0" 
                src={`https://maps.google.com/maps?q=${chairData?.Active_Alert?.Lat || 12.9716},${chairData?.Active_Alert?.Long || 77.5946}&z=15&output=embed`}
                className="grayscale invert contrast-125 opacity-70"
               ></iframe>
            </div>

            {/* 📞 CARETAKER HUB */}
            <div className="bg-white/5 p-10 rounded-[3rem] flex flex-col md:flex-row justify-between items-center border border-white/10">
               <div>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Primary Response Contact</p>
                  <p className="text-5xl font-black tracking-tighter">{userProfile.profile.mobile}</p>
               </div>
               <a href={`tel:${userProfile.profile.mobile}`} className="bg-blue-600 px-12 py-5 rounded-[2rem] font-black text-xs shadow-xl hover:scale-105 transition-all">VOICE CALL NOW</a>
            </div>
          </div>
        )}

        {activeTab === 'report' && (
          <div className="space-y-8 animate-in slide-in-from-right duration-700">
             <div className="bg-white/5 p-10 rounded-[4rem] border border-white/10">
                <h3 className="text-3xl font-black mb-10 uppercase italic tracking-tighter">7-Day Forensic Log</h3>
                <div className="h-[350px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>({day:d, count:logs.filter(l=>l.Day?.startsWith(d)).length}))}>
                         <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:'rgba(255,255,255,0.3)', fontWeight:900, fontSize:10}}/>
                         <Tooltip contentStyle={{background:'#0f172a', border:'none', borderRadius:'15px'}}/>
                         <Bar dataKey="count" radius={[15,15,0,0]} barSize={50}>
                            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((e,i)=><Cell key={i} fill={logs.filter(l=>l.Day?.startsWith(e)).length>0?'#ef4444':'#3b82f6'}/>)}
                         </Bar>
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </div>
             <div className="bg-white/5 rounded-[3rem] border border-white/5 overflow-hidden">
                <table className="w-full text-left text-[10px] font-mono">
                  <thead className="bg-white/5 text-white/30 uppercase tracking-[0.2em] border-b border-white/5">
                    <tr><th className="p-8">Timestamp</th><th className="p-8">Spatial Axis</th><th className="p-8">Location</th><th className="p-8 text-right">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {logs.reverse().slice(0,12).map((l,i)=>(
                      <tr key={i} className="hover:bg-white/5 transition-colors">
                        <td className="p-8 font-black"><span className="text-blue-400 block mb-1">{l.Date}</span> {l.Time} ({l.Day})</td>
                        <td className="p-8 opacity-60">X:{l.Axis_X} | Y:{l.Axis_Y}</td>
                        <td className="p-8"><a href={l.Google_Maps} target="_blank" className="text-emerald-400 underline font-black tracking-tighter hover:text-white transition">OPEN_MAP_LOG</a></td>
                        <td className="p-8 text-right"><span className="bg-red-500/20 text-red-500 px-3 py-1 rounded-full text-[9px] font-black">FALL_LOGGED</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
             <div className="bg-white/5 p-12 md:p-16 rounded-[5rem] border border-white/10">
                <div className="text-center mb-12">
                   <div className="w-24 h-24 bg-blue-600/20 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl border border-blue-500/30 shadow-2xl">👤</div>
                   <h2 className="text-4xl font-black uppercase tracking-tight">{userProfile.profile.name}</h2>
                   <p className="text-blue-400 font-mono text-[10px] mt-2 uppercase tracking-[0.3em]">Patient ID: {auth.currentUser.uid.slice(0,10)}</p>
                </div>

                {/* READ-ONLY CLINICAL HISTORY */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                   <h3 className="col-span-full text-[10px] font-black text-blue-400 uppercase tracking-[0.5em] border-b border-white/10 pb-4">Permanent Medical Record</h3>
                   <div className="bg-white/5 p-5 rounded-3xl border border-white/5"><p className="text-[9px] font-black opacity-30 uppercase mb-2">Biometrics</p><p className="font-bold text-sm">{userProfile.profile.age}Y • {userProfile.profile.weight}KG • {userProfile.profile.gender}</p></div>
                   <div className="bg-white/5 p-5 rounded-3xl border border-white/5"><p className="text-[9px] font-black opacity-30 uppercase mb-2">Category / Status</p><p className="font-bold text-sm">{userProfile.profile.maritalStatus} • {userProfile.profile.category}</p></div>
                   <div className="bg-white/5 p-5 rounded-3xl border border-white/5"><p className="text-[9px] font-black opacity-30 uppercase mb-2">Enrollment Vitals</p><p className="font-bold text-sm">{userProfile.profile.bp} BP • {userProfile.profile.heartRate} HR</p></div>
                   <div className="bg-white/5 p-5 rounded-3xl border border-white/5"><p className="text-[9px] font-black opacity-30 uppercase mb-2">Linked Hardware</p><p className="font-mono text-xs font-bold text-blue-400 uppercase">{userProfile.linkedDevice}</p></div>
                   <div className="col-span-full bg-white/5 p-6 rounded-3xl border border-white/5">
                      <p className="text-[9px] font-black opacity-30 uppercase mb-2">Clinical Diagnosis</p>
                      <p className="text-blue-300 italic mb-1 text-sm">"{userProfile.profile.cause}"</p>
                      <p className="text-[10px] opacity-40">Secondary Conditions: {userProfile.profile.extraDiseases}</p>
                   </div>
                </div>

                {/* EDITABLE CREDENTIALS */}
                <div className="space-y-6">
                   <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.5em] border-b border-white/10 pb-4">Update Primary Contact</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[9px] font-black opacity-30 uppercase ml-2">Email Address</label>
                         <input type="email" defaultValue={userProfile.profile.email} id="edit-email" className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 text-sm font-bold outline-none focus:border-emerald-500 transition-all" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black opacity-30 uppercase ml-2">Response Phone</label>
                         <input type="text" defaultValue={userProfile.profile.mobile} id="edit-mobile" className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 text-sm font-bold outline-none focus:border-emerald-500 transition-all" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                         <label className="text-[9px] font-black opacity-30 uppercase ml-2">Secure Password Update</label>
                         <input type="password" placeholder="New Secret Password" id="edit-pass" className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 text-sm font-bold outline-none focus:border-emerald-500 transition-all" />
                      </div>
                   </div>
                   <button 
                      onClick={async () => {
                         const user = auth.currentUser;
                         const newE = document.getElementById('edit-email').value;
                         const newM = document.getElementById('edit-mobile').value;
                         const newP = document.getElementById('edit-pass').value;
                         try {
                            await set(ref(db, `Wheel_Chair_Users/${user.uid}/profile/email`), newE);
                            await set(ref(db, `Wheel_Chair_Users/${user.uid}/profile/mobile`), newM);
                            if(newP) await updatePassword(user, newP);
                            alert("Records Updated Successfully!");
                         } catch (e) { alert(e.message); }
                      }}
                      className="w-full bg-emerald-600 py-5 rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-xl transition-all"
                   >
                      Synchronize Records
                   </button>
                </div>

                <button onClick={() => {signOut(auth); window.location.reload();}} className="w-full py-7 border-2 border-red-500/30 text-red-500 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.4em] mt-12 hover:bg-red-500 hover:text-white transition-all">TERMINATE SESSION</button>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}