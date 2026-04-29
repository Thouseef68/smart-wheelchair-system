"use client";
import React, { useState } from 'react';
import { auth, db } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { ref, set, get, query, orderByChild, equalTo } from 'firebase/database';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [regData, setRegData] = useState({
    name: '', mobile: '', email: '', password: '',
    age: '', weight: '', gender: 'Male', maritalStatus: 'Single', category: 'Elderly',
    bp: '', heartRate: '', cause: '', extraDiseases: '', yearsUsingWheelchair: '', deviceId: ''
  });

  const handleAuth = async (e) => {
    e.preventDefault();
    const cleanID = regData.deviceId.toUpperCase().replace(/[:\s]/g, '');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, regData.email, regData.password);
      } else {
        const idQuery = query(ref(db, 'Wheel_Chair_Users'), orderByChild('linkedDevice'), equalTo(cleanID));
        const snap = await get(idQuery);
        if (snap.exists()) { alert("🛑 MAC ID already registered!"); return; }

        const res = await createUserWithEmailAndPassword(auth, regData.email, regData.password);
        await set(ref(db, `Wheel_Chair_Users/${res.user.uid}`), {
          profile: { ...regData, name: regData.name.toUpperCase() },
          linkedDevice: cleanID
        });
        alert("Patient Successfully Registered!");
      }
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="rgb-border-box p-[3px] rounded-[2.5rem] max-w-2xl w-full">
        <div className="bg-white rounded-[2.4rem] overflow-hidden shadow-2xl relative z-10">
          <div className="flex bg-slate-100 p-2 border-b">
            <button type="button" onClick={() => setIsLogin(true)} className={`flex-1 py-4 rounded-2xl font-black ${isLogin ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}>LOGIN</button>
            <button type="button" onClick={() => setIsLogin(false)} className={`flex-1 py-4 rounded-2xl font-black ${!isLogin ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}>REGISTER</button>
          </div>
          <form onSubmit={handleAuth} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto text-slate-900 custom-scroll">
            {!isLogin ? (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-blue-600 uppercase border-l-4 border-blue-600 pl-2">1. Identity</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="Full Name" className="input-f" onChange={e => setRegData({...regData, name: e.target.value})} />
                    <input type="text" placeholder="Mobile" className="input-f" onChange={e => setRegData({...regData, mobile: e.target.value})} />
                  </div>
                  <input type="email" placeholder="Email" className="input-f" onChange={e => setRegData({...regData, email: e.target.value})} />
                  <input type="password" placeholder="Password" className="input-f" onChange={e => setRegData({...regData, password: e.target.value})} />
                </div>
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-emerald-600 uppercase border-l-4 border-emerald-600 pl-2">2. Biometrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <input type="text" placeholder="Age" className="input-f" onChange={e => setRegData({...regData, age: e.target.value})} />
                    <input type="text" placeholder="Weight" className="input-f" onChange={e => setRegData({...regData, weight: e.target.value})} />
                    <select className="input-f" onChange={e => setRegData({...regData, gender: e.target.value})}><option value="Male">Male</option><option value="Female">Female</option></select>
                    <select className="input-f" onChange={e => setRegData({...regData, maritalStatus: e.target.value})}><option value="Single">Single</option><option value="Married">Married</option></select>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <select className="input-f" onChange={e => setRegData({...regData, category: e.target.value})}><option value="Elderly">Elderly</option><option value="Younger">Younger</option></select>
                    <input type="text" placeholder="BP" className="input-f" onChange={e => setRegData({...regData, bp: e.target.value})} />
                    <input type="text" placeholder="Heart" className="input-f" onChange={e => setRegData({...regData, heartRate: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-red-600 uppercase border-l-4 border-red-600 pl-2">3. History & MAC</h3>
                  <input type="text" placeholder="Cause" className="input-f" onChange={e => setRegData({...regData, cause: e.target.value})} />
                  <input type="text" placeholder="Diseases" className="input-f" onChange={e => setRegData({...regData, extraDiseases: e.target.value})} />
                  <input type="text" placeholder="Years using" className="input-f" onChange={e => setRegData({...regData, yearsUsingWheelchair: e.target.value})} />
                  <input type="text" placeholder="MAC ID" className="w-full bg-slate-900 text-white p-4 rounded-xl font-mono" onChange={e => setRegData({...regData, deviceId: e.target.value})} />
                </div>
              </div>
            ) : (
              <div className="py-10 space-y-4">
                <input type="email" placeholder="Email" className="input-f" onChange={e => setRegData({...regData, email: e.target.value})} />
                <input type="password" placeholder="Password" className="input-f" onChange={e => setRegData({...regData, password: e.target.value})} />
              </div>
            )}
            <button className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase tracking-widest shadow-xl">Proceed</button>
          </form>
        </div>
      </div>
      <style jsx>{`
        .rgb-border-box { position: relative; overflow: hidden; }
        .rgb-border-box::before { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: conic-gradient(#ff0000, #ff7300, #fffb00, #48ff00, #00ffd5, #002bff, #7a00ff, #ff00c8, #ff0000); animation: rotate 4s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .input-f { width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 12px; font-weight: 700; background: white; }
        .custom-scroll::-webkit-scrollbar { width: 5px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
}