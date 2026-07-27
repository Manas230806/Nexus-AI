'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Phone, Video, Mic, MicOff, Volume2, VolumeX, CameraOff, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type CallType = 'audio' | 'video';

interface CallContextType {
  startCall: (targetUserId: string, targetUserName: string, type: CallType) => void;
  endCall: () => void;
  isCalling: boolean;
  activeCall: any;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

// ─── Ringtone Generator (Web Audio) ───────────────────────────────
function createRingtone(): { start: () => void; stop: () => void } {
  let ctx: AudioContext | null = null;
  let osc1: OscillatorNode | null = null;
  let osc2: OscillatorNode | null = null;
  let gain: GainNode | null = null;
  let interval: any = null;

  return {
    start() {
      try {
        ctx = new AudioContext();
        gain = ctx.createGain();
        gain.connect(ctx.destination);
        gain.gain.value = 0;

        osc1 = ctx.createOscillator();
        osc2 = ctx.createOscillator();
        osc1.frequency.value = 440;
        osc2.frequency.value = 480;
        osc1.connect(gain);
        osc2.connect(gain);
        osc1.start();
        osc2.start();

        let on = true;
        interval = setInterval(() => {
          if (gain) gain.gain.value = on ? 0.15 : 0;
          on = !on;
        }, 1000);
      } catch (e) { console.warn('Ringtone error', e); }
    },
    stop() {
      if (interval) clearInterval(interval);
      if (osc1) try { osc1.stop(); } catch(e) {}
      if (osc2) try { osc2.stop(); } catch(e) {}
      if (ctx) try { ctx.close(); } catch(e) {}
      osc1 = null; osc2 = null; gain = null; ctx = null; interval = null;
    }
  };
}

function createDialTone(): { start: () => void; stop: () => void } {
  let ctx: AudioContext | null = null;
  let osc: OscillatorNode | null = null;
  let gain: GainNode | null = null;
  let interval: any = null;

  return {
    start() {
      try {
        ctx = new AudioContext();
        gain = ctx.createGain();
        gain.connect(ctx.destination);
        gain.gain.value = 0;

        osc = ctx.createOscillator();
        osc.frequency.value = 400;
        osc.type = 'sine';
        osc.connect(gain);
        osc.start();

        let on = true;
        gain.gain.value = 0.08;
        interval = setInterval(() => {
          if (gain) gain.gain.value = on ? 0 : 0.08;
          on = !on;
        }, 3000);
      } catch (e) { console.warn('Dial tone error', e); }
    },
    stop() {
      if (interval) clearInterval(interval);
      if (osc) try { osc.stop(); } catch(e) {}
      if (ctx) try { ctx.close(); } catch(e) {}
      osc = null; gain = null; ctx = null; interval = null;
    }
  };
}

// ─── Call Timer ────────────────────────────────────────────────────
function useCallTimer(isActive: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!isActive) { setSeconds(0); return; }
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [isActive]);
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

// ─── Provider ──────────────────────────────────────────────────────
export function CallProvider({ children }: { children: React.ReactNode }) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('Boss');
  
  const [incomingCall, setIncomingCall] = useState<string | null>(null);
  const [pendingOffer, setPendingOffer] = useState<any>(null);
  const [activeCall, setActiveCall] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [callType, setCallType] = useState<CallType>('audio');
  
  const [remoteUser, setRemoteUser] = useState<{ id: string; name: string } | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);

  const ringtoneRef = useRef<ReturnType<typeof createRingtone> | null>(null);
  const dialToneRef = useRef<ReturnType<typeof createDialTone> | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const signalingChannelRef = useRef<any>(null);
  const iceCandidatesQueueRef = useRef<any[]>([]);

  const isConnected = !!(activeCall && remoteStream);
  const timer = useCallTimer(isConnected);

  const setElementStream = (el: HTMLMediaElement | null, stream: MediaStream | null) => {
    if (!el) return;
    if (el.srcObject !== stream) {
      el.srcObject = stream;
      if (stream) {
        el.play().catch(e => console.warn("Playback play() failed:", e));
      }
    }
  };

  const sendSignalingMessage = async (targetId: string, event: string, payload: any) => {
     if (signalingChannelRef.current && currentUserId) {
       await signalingChannelRef.current.send({
          type: 'broadcast',
          event,
          payload: { ...payload, targetId, senderId: currentUserId }
       });
     }
  };

  const createPeerConnection = (targetId: string, stream: MediaStream) => {
    if (pcRef.current) pcRef.current.close();

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' },
        { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
        { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
        { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' }
      ]
    });

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        if (dialToneRef.current) { dialToneRef.current.stop(); dialToneRef.current = null; }
        if (ringtoneRef.current) { ringtoneRef.current.stop(); ringtoneRef.current = null; }
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && currentUserId) {
        sendSignalingMessage(targetId, 'ICE_CANDIDATE', { candidate: event.candidate });
      }
    };

    pcRef.current = pc;
    return pc;
  };

  useEffect(() => {
    let signalingChannel: any = null;

    const initSignaling = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const myId = session.user.id;
      setCurrentUserId(myId);

      const { data: myData } = await supabase.from('users').select('name').eq('id', myId).single();
      setCurrentUserName(myData?.name || 'Boss');

      signalingChannel = supabase.channel('global_workspace_calls')
        .on('broadcast', { event: 'OFFER' }, async ({ payload }) => {
           if (payload.targetId !== myId) return;
           setRemoteUser({ id: payload.callerId, name: payload.callerName });
           setCallType(payload.type);
           setPendingOffer(payload.offer);
           setIncomingCall(payload.callerId);
           if (ringtoneRef.current) ringtoneRef.current.stop();
           ringtoneRef.current = createRingtone();
           ringtoneRef.current.start();
        })
        .on('broadcast', { event: 'ANSWER' }, async ({ payload }) => {
           if (payload.targetId !== myId) return;
           console.log("WebRTC: Received ANSWER");
           if (pcRef.current) {
              await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
              // Process any queued candidates received while setting description
              await processIceCandidatesQueue(pcRef.current);
           }
        })
        .on('broadcast', { event: 'ICE_CANDIDATE' }, async ({ payload }) => {
           if (payload.targetId !== myId) return;
           if (pcRef.current && pcRef.current.remoteDescription) {
              try { await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate)); } catch (e) {}
           } else {
              iceCandidatesQueueRef.current.push(payload.candidate);
           }
        })
        .on('broadcast', { event: 'CALL_END' }, ({ payload }) => {
           if (payload.targetId !== myId && payload.senderId !== myId) return;
           forceCleanup();
        })
        .subscribe();

      signalingChannelRef.current = signalingChannel;
    };

    initSignaling();
    return () => { if (signalingChannel) supabase.removeChannel(signalingChannel); forceCleanup(); };
  }, []);

  const forceCleanup = () => {
    if (ringtoneRef.current) { ringtoneRef.current.stop(); ringtoneRef.current = null; }
    if (dialToneRef.current) { dialToneRef.current.stop(); dialToneRef.current = null; }
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    setActiveCall(false);
    setIsCalling(false);
    setIncomingCall(null);
    setPendingOffer(null);
    setRemoteStream(null);
    setLocalStream((oldStream) => {
       if (oldStream) oldStream.getTracks().forEach(track => track.stop());
       return null;
    });
    setIsMuted(false);
    setIsVideoOff(false);
    iceCandidatesQueueRef.current = [];
  };

  const notifyRemoteEnd = async (targetId: string) => { await sendSignalingMessage(targetId, 'CALL_END', {}); };

  const startCall = async (targetUserId: string, targetUserName: string, type: CallType) => {
    try {
      setIsCalling(true);
      setCallType(type);
      setRemoteUser({ id: targetUserId, name: targetUserName });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' });
      setLocalStream(stream);
      const pc = createPeerConnection(targetUserId, stream);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sendSignalingMessage(targetUserId, 'OFFER', { offer, callerId: currentUserId, callerName: currentUserName, type });
      dialToneRef.current = createDialTone();
      dialToneRef.current.start();
      setActiveCall(true);
    } catch (err) { alert("Could not access camera/microphone."); forceCleanup(); }
  };

  const answerCall = async () => {
    if (!incomingCall || !pendingOffer) return;
    if (ringtoneRef.current) { ringtoneRef.current.stop(); ringtoneRef.current = null; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callType === 'video' });
      setLocalStream(stream);
      const pc = createPeerConnection(incomingCall, stream);
      await pc.setRemoteDescription(new RTCSessionDescription(pendingOffer));
      // Process queued candidates immediately after remote description is set
      await processIceCandidatesQueue(pc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await sendSignalingMessage(incomingCall, 'ANSWER', { answer });
      setActiveCall(true);
      setIncomingCall(null);
      setPendingOffer(null);
    } catch(err) { alert("Could not access camera/microphone."); forceCleanup(); }
  };

  const rejectCall = () => {
    if (ringtoneRef.current) { ringtoneRef.current.stop(); ringtoneRef.current = null; }
    if (incomingCall) notifyRemoteEnd(incomingCall);
    forceCleanup();
  };

  const endCall = () => {
    if (remoteUser?.id) notifyRemoteEnd(remoteUser.id);
    forceCleanup();
  };

  const toggleMute = () => {
    if (localStream) {
      const t = localStream.getAudioTracks()[0];
      if (t) { t.enabled = !t.enabled; setIsMuted(!t.enabled); }
    }
  };

  const toggleVideo = () => {
    if (localStream && callType === 'video') {
      const t = localStream.getVideoTracks()[0];
      if (t) { t.enabled = !t.enabled; setIsVideoOff(!t.enabled); }
    }
  };

  const flipCamera = async () => {
    if (!localStream || callType !== 'video') return;
    const currentTrack = localStream.getVideoTracks()[0];
    if (!currentTrack) return;
    const settings = currentTrack.getSettings();
    const newFacing = settings.facingMode === 'user' ? 'environment' : 'user';
    currentTrack.stop();
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: newFacing }, audio: true });
      setLocalStream(newStream);
      if (pcRef.current) {
        const sender = pcRef.current.getSenders().find((s: any) => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(newStream.getVideoTracks()[0]);
      }
    } catch(e) { console.warn('Flip camera failed', e); }
  };

  const getInitial = (name: string) => (name || '?')[0].toUpperCase();
  const getTracksInfo = (stream: MediaStream | null) => {
    if (!stream) return 'None';
    return stream.getTracks().map(t => `${t.kind}:${t.enabled ? 'ON' : 'OFF'}`).join(',');
  };

  return (
    <CallContext.Provider value={{ startCall, endCall, isCalling, activeCall }}>
      {children}
      <audio muted autoPlay ref={(el) => setElementStream(el, localStream)} className="absolute w-0 h-0 opacity-0 pointer-events-none" />
      <audio autoPlay muted={isSpeakerOff} ref={(el) => setElementStream(el, remoteStream)} className="absolute w-0 h-0 opacity-0 pointer-events-none" />
      <AnimatePresence>
        {incomingCall && !activeCall && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-gradient-to-b from-gray-900 via-black to-gray-900 p-4 sm:p-8 safe-area-inset">
            <div className="pt-8 sm:pt-12" />
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <div className="relative">
                <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-4xl sm:text-5xl font-bold shadow-2xl shadow-emerald-500/20">{getInitial(remoteUser?.name || '')}</div>
                <div className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-30" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-2">{remoteUser?.name || 'Unknown'}</h2>
              <p className="text-gray-400 text-xs sm:text-sm font-medium tracking-wide uppercase">Incoming {callType === 'video' ? 'Video' : 'Voice'} Call</p>
            </div>
            <div className="flex items-center gap-12 sm:gap-16 pb-8 sm:pb-12">
              <div className="flex flex-col items-center gap-2">
                <button onClick={rejectCall} className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/30 hover:bg-red-600"><Phone className="h-6 w-6 sm:h-7 sm:w-7 rotate-[135deg]" /></button>
                <span className="text-[10px] sm:text-xs text-gray-400 font-medium">Decline</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <button onClick={answerCall} className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600">{callType === 'video' ? <Video className="h-6 w-6 sm:h-7 sm:w-7" /> : <Phone className="h-6 w-6 sm:h-7 sm:w-7" />}</button>
                <span className="text-[10px] sm:text-xs text-gray-400 font-medium">Accept</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {(isCalling || activeCall) && callType === 'audio' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9998] flex flex-col items-center justify-between bg-gradient-to-b from-gray-900 via-black to-gray-900 p-4 sm:p-8 safe-area-inset">
            <div className="absolute top-4 left-4 text-[10px] text-white/45 bg-black/50 p-3 rounded-xl font-mono text-left select-none max-w-[240px] border border-white/10 backdrop-blur-md z-30 flex flex-col gap-1">
              <div className="font-bold text-white mb-1">Nexus Diagnostics</div>
              <div>Connection: {remoteStream ? 'Connected' : 'Connecting'}</div>
              <div>Local: {getTracksInfo(localStream)}</div>
              <div>Remote: {getTracksInfo(remoteStream)}</div>
            </div>
            <div className="pt-8 sm:pt-12" />
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <div className="relative">
                <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white text-4xl sm:text-5xl font-bold shadow-2xl">{getInitial(remoteUser?.name || '')}</div>
                {!isConnected && <div className="absolute inset-0 rounded-full border-2 border-violet-400 animate-ping opacity-30" />}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-2">{remoteUser?.name || 'Unknown'}</h2>
              <p className="text-gray-400 text-sm font-medium tracking-wide">
                {isConnected ? <span className="text-emerald-400 text-base sm:text-lg font-mono">{timer}</span> : <span className="uppercase tracking-widest text-xs sm:text-sm">Calling...</span>}
              </p>
            </div>
            <div className="flex items-center gap-6 sm:gap-8 pb-8 sm:pb-12">
              <div className="flex flex-col items-center gap-1.5">
                <button onClick={toggleMute} className={`h-12 w-12 sm:h-14 sm:w-14 rounded-full flex items-center justify-center ${isMuted ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>{isMuted ? <MicOff className="h-5 w-5 sm:h-6 sm:w-6" /> : <Mic className="h-5 w-5 sm:h-6 sm:w-6" />}</button>
                <span className="text-[10px] text-gray-500 uppercase">{isMuted ? 'Unmute' : 'Mute'}</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <button onClick={endCall} className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600"><Phone className="h-6 w-6 sm:h-7 sm:w-7 rotate-[135deg]" /></button>
                <span className="text-[10px] text-gray-500 uppercase">End</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <button onClick={() => setIsSpeakerOff(!isSpeakerOff)} className={`h-12 w-12 sm:h-14 sm:w-14 rounded-full flex items-center justify-center ${isSpeakerOff ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>{isSpeakerOff ? <VolumeX className="h-5 w-5 sm:h-6 sm:w-6" /> : <Volume2 className="h-5 w-5 sm:h-6 sm:w-6" />}</button>
                <span className="text-[10px] text-gray-500 uppercase">{isSpeakerOff ? 'Unmute' : 'Speaker'}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {(isCalling || activeCall) && callType === 'video' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9998] flex flex-col bg-black safe-area-inset">
            <video ref={(el) => setElementStream(el, remoteStream)} autoPlay playsInline muted={isSpeakerOff} className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-500 ${remoteStream ? 'opacity-100' : 'opacity-0'}`} />
            {!remoteStream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 via-black to-gray-900 z-0">
                <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold shadow-2xl">{getInitial(remoteUser?.name || '')}</div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mt-4">{remoteUser?.name || 'Unknown'}</h2>
                <p className="text-gray-400 text-xs tracking-widest uppercase mt-2">Calling...</p>
              </div>
            )}
            <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-start justify-between z-20 bg-gradient-to-b from-black/60 to-transparent">
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-bold text-white">{remoteUser?.name || 'Unknown'}</span>
                <span className="text-xs sm:text-sm text-emerald-400 font-mono">{isConnected ? timer : 'Calling...'}</span>
              </div>
              <div className="text-[10px] text-white/45 bg-black/50 p-3 rounded-xl font-mono text-left border border-white/10 backdrop-blur-md z-30 flex flex-col gap-1">
                <div className="font-bold text-white mb-1">Nexus Diagnostics</div>
                <div>Connection: {remoteStream ? 'Connected' : 'Connecting'}</div>
                <div>Local: {getTracksInfo(localStream)}</div>
                <div>Remote: {getTracksInfo(remoteStream)}</div>
              </div>
            </div>
            <div className="absolute top-16 right-3 sm:right-4 w-24 h-36 bg-gray-900 rounded-xl overflow-hidden border-2 border-white/20 z-20">
              <video ref={(el) => setElementStream(el, localStream)} autoPlay playsInline muted className={`w-full h-full object-cover ${isVideoOff || !localStream ? 'hidden' : 'block'}`} style={{ transform: 'scaleX(-1)' }} />
              {(isVideoOff || !localStream) && <div className="w-full h-full flex items-center justify-center bg-gray-800"><CameraOff className="h-6 w-6 text-gray-500" /></div>}
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 flex justify-center items-center gap-3 sm:gap-6 z-20 bg-gradient-to-t from-black/70 to-transparent">
              <div className="flex flex-col items-center gap-1">
                <button onClick={toggleMute} className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center ${isMuted ? 'bg-white text-black' : 'bg-white/15 text-white backdrop-blur-md'}`}>{isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}</button>
                <span className="text-[9px] text-white/60">Mute</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <button onClick={toggleVideo} className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center ${isVideoOff ? 'bg-white text-black' : 'bg-white/15 text-white backdrop-blur-md'}`}>{isVideoOff ? <CameraOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}</button>
                <span className="text-[9px] text-white/60">Camera</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <button onClick={flipCamera} className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/15 text-white backdrop-blur-md flex items-center justify-center"><RotateCcw className="h-4 w-4" /></button>
                <span className="text-[9px] text-white/60">Flip</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <button onClick={() => setIsSpeakerOff(!isSpeakerOff)} className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center ${isSpeakerOff ? 'bg-white text-black' : 'bg-white/15 text-white backdrop-blur-md'}`}>{isSpeakerOff ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button>
                <span className="text-[9px] text-white/60">Speaker</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <button onClick={endCall} className="h-12 w-12 rounded-full bg-red-500 flex items-center justify-center"><Phone className="h-5 w-5 rotate-[135deg]" /></button>
                <span className="text-[9px] text-white/60">End</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </CallContext.Provider>
  );
}

export const useCall = () => {
  const context = useContext(CallContext);
  if (context === undefined) throw new Error('useCall must be used within a CallProvider');
  return context;
};
