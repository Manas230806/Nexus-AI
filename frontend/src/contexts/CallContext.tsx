'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
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
        // Ring pattern: 2s on, 4s off
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
  const [peer, setPeer] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [activeCall, setActiveCall] = useState<any>(null);
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
  const peerRef = useRef<any>(null);

  const isConnected = !!(activeCall && remoteStream);
  const timer = useCallTimer(isConnected);

  // ─── Init PeerJS + Supabase Signaling ────────────────────────
  useEffect(() => {
    let callChannel: any = null;

    const initPeerAndSignaling = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const myId = session.user.id;
      setCurrentUserId(myId);

      callChannel = supabase.channel(`call_signals_${myId}`)
        .on('broadcast', { event: 'CALL_END' }, () => { forceCleanup(); })
        .subscribe();

      import('peerjs').then(({ default: PeerClass }) => {
        if (peerRef.current) {
          peerRef.current.destroy();
          peerRef.current = null;
        }

        const newPeer = new PeerClass(myId, {
           config: {
              iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:global.stun.twilio.com:3478' },
                { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
                { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
                { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' }
              ]
           }
        });
        
        peerRef.current = newPeer;
        
        newPeer.on('call', async (call: any) => {
          const { data: callerData } = await supabase.from('users').select('name').eq('id', call.peer).single();
          setRemoteUser({ id: call.peer, name: callerData?.name || 'Unknown User' });
          setCallType(call.metadata?.type || 'audio');

          call.on('stream', (rStream: any) => {
            console.log('Received remote stream from caller');
            setRemoteStream(rStream);
            // Stop ringtone when stream arrives (call connected)
            if (ringtoneRef.current) { ringtoneRef.current.stop(); ringtoneRef.current = null; }
          });
          call.on('close', forceCleanup);
          call.on('error', forceCleanup);

          // Start ringtone
          ringtoneRef.current = createRingtone();
          ringtoneRef.current.start();

          setIncomingCall(call);
        });

        newPeer.on('error', (err: any) => console.error("PeerJS Error:", err));
        setPeer(newPeer);
      }).catch(err => console.error("PeerJS import error", err));
    };

    initPeerAndSignaling();
    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      if (callChannel) supabase.removeChannel(callChannel);
    };
  }, []);

  // ─── Cleanup ─────────────────────────────────────────────────
  const forceCleanup = () => {
    // Stop all tones
    if (ringtoneRef.current) { ringtoneRef.current.stop(); ringtoneRef.current = null; }
    if (dialToneRef.current) { dialToneRef.current.stop(); dialToneRef.current = null; }

    setActiveCall((oldCall: any) => { if (oldCall) oldCall.close(); return null; });
    setIncomingCall((oldIncoming: any) => { if (oldIncoming) oldIncoming.close(); return null; });
    setIsCalling(false);
    setRemoteStream(null);
    setLocalStream((oldStream: MediaStream | null) => {
       if (oldStream) oldStream.getTracks().forEach(track => track.stop());
       return null;
    });
    setIsMuted(false);
    setIsVideoOff(false);
  };

  const notifyRemoteEnd = async (targetId: string) => {
     await supabase.channel(`call_signals_${targetId}`).send({
        type: 'broadcast', event: 'CALL_END', payload: {}
     });
  };

  // ─── Start Call (Outgoing) ───────────────────────────────────
  const startCall = async (targetUserId: string, targetUserName: string, type: CallType) => {
    if (!peer) return alert("Call system disconnected. Please refresh.");
    try {
      setIsCalling(true);
      setCallType(type);
      setRemoteUser({ id: targetUserId, name: targetUserName });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' });
      setLocalStream(stream);
      
      // Play dial tone
      dialToneRef.current = createDialTone();
      dialToneRef.current.start();

      const call = peer.call(targetUserId, stream, { metadata: { type } });
      call.on('stream', (rStream: any) => {
        setRemoteStream(rStream);
        // Stop dial tone when connected
        if (dialToneRef.current) { dialToneRef.current.stop(); dialToneRef.current = null; }
      });
      call.on('close', forceCleanup);
      call.on('error', forceCleanup);
      setActiveCall(call);
    } catch (err) {
      console.error("Failed to start call", err);
      alert("Could not access camera/microphone.");
      forceCleanup();
    }
  };

  // ─── Answer Call ─────────────────────────────────────────────
  const answerCall = async () => {
    if (!incomingCall) return;
    // Stop ringtone
    if (ringtoneRef.current) { ringtoneRef.current.stop(); ringtoneRef.current = null; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callType === 'video' });
      setLocalStream(stream);

      incomingCall.on('close', forceCleanup);
      incomingCall.on('error', forceCleanup);
      incomingCall.answer(stream);
      
      setActiveCall(incomingCall);
      setIncomingCall(null);
    } catch(err) {
       console.error("Failed to answer", err);
       alert("Could not access camera/microphone.");
       forceCleanup();
    }
  };

  const rejectCall = () => {
    if (ringtoneRef.current) { ringtoneRef.current.stop(); ringtoneRef.current = null; }
    if (incomingCall) notifyRemoteEnd(incomingCall.peer);
    forceCleanup();
  };

  const endCall = () => {
    if (remoteUser?.id) notifyRemoteEnd(remoteUser.id);
    forceCleanup();
  };

  // ─── Toggles ─────────────────────────────────────────────────
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
      // Replace track in active call
      if (activeCall?.peerConnection) {
        const sender = activeCall.peerConnection.getSenders().find((s: any) => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(newStream.getVideoTracks()[0]);
      }
    } catch(e) { console.warn('Flip camera failed', e); }
  };

  // ─── Profile Initial ────────────────────────────────────────
  const getInitial = (name: string) => (name || '?')[0].toUpperCase();

  // ═══════════════════════════════════════════════════════════════
  //  R E N D E R
  // ═══════════════════════════════════════════════════════════════
  return (
    <CallContext.Provider value={{ startCall, endCall, isCalling, activeCall }}>
      {children}
      
      {/* ALWAYS render a hidden audio for remote stream - this guarantees voice works for ALL call types */}
      {localStream && (
         <audio muted autoPlay ref={(el) => { if (el && el.srcObject !== localStream) { el.srcObject = localStream; el.play().catch(() => {}); }}} className="hidden" />
      )}
      {remoteStream && (
         <audio autoPlay muted={isSpeakerOff} ref={(el) => { if (el && el.srcObject !== remoteStream) { el.srcObject = remoteStream; el.play().catch(() => {}); }}} className="hidden" />
      )}

      {/* ─── INCOMING CALL (Instagram-style fullscreen) ─── */}
      <AnimatePresence>
        {incomingCall && !activeCall && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-gradient-to-b from-gray-900 via-black to-gray-900 p-4 sm:p-8 safe-area-inset"
          >
            {/* Top spacer */}
            <div className="pt-8 sm:pt-12" />

            {/* Profile */}
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <div className="relative">
                <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-4xl sm:text-5xl font-bold shadow-2xl shadow-emerald-500/20">
                  {getInitial(remoteUser?.name || '')}
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-30" />
                <div className="absolute -inset-2 rounded-full border border-emerald-400/20 animate-pulse" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-2">{remoteUser?.name || 'Unknown'}</h2>
              <p className="text-gray-400 text-xs sm:text-sm font-medium tracking-wide uppercase">
                Incoming {callType === 'video' ? 'Video' : 'Voice'} Call
              </p>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-12 sm:gap-16 pb-8 sm:pb-12">
              <div className="flex flex-col items-center gap-2">
                <button onClick={rejectCall} className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/30 hover:bg-red-600 active:scale-95 transition-all">
                  <Phone className="h-6 w-6 sm:h-7 sm:w-7 rotate-[135deg]" />
                </button>
                <span className="text-[10px] sm:text-xs text-gray-400 font-medium">Decline</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <button onClick={answerCall} className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 active:scale-95 transition-all">
                  {callType === 'video' ? <Video className="h-6 w-6 sm:h-7 sm:w-7" /> : <Phone className="h-6 w-6 sm:h-7 sm:w-7" />}
                </button>
                <span className="text-[10px] sm:text-xs text-gray-400 font-medium">Accept</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── OUTGOING / ACTIVE VOICE CALL (Instagram-style fullscreen) ─── */}
      <AnimatePresence>
        {(isCalling || activeCall) && callType === 'audio' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] flex flex-col items-center justify-between bg-gradient-to-b from-gray-900 via-black to-gray-900 p-4 sm:p-8 safe-area-inset"
          >
            {/* Top spacer */}
            <div className="pt-8 sm:pt-12" />

            {/* Profile + status */}
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <div className="relative">
                <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white text-4xl sm:text-5xl font-bold shadow-2xl shadow-violet-500/20">
                  {getInitial(remoteUser?.name || '')}
                </div>
                {!isConnected && <div className="absolute inset-0 rounded-full border-2 border-violet-400 animate-ping opacity-30" />}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-2">{remoteUser?.name || 'Unknown'}</h2>
              <p className="text-gray-400 text-sm font-medium tracking-wide">
                {isConnected ? (
                  <span className="text-emerald-400 text-base sm:text-lg font-mono">{timer}</span>
                ) : (
                  <span className="uppercase tracking-widest text-xs sm:text-sm">Calling...</span>
                )}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-6 sm:gap-8 pb-8 sm:pb-12">
              <div className="flex flex-col items-center gap-1.5">
                <button onClick={toggleMute} className={`h-12 w-12 sm:h-14 sm:w-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>
                  {isMuted ? <MicOff className="h-5 w-5 sm:h-6 sm:w-6" /> : <Mic className="h-5 w-5 sm:h-6 sm:w-6" />}
                </button>
                <span className="text-[10px] text-gray-500 uppercase">{isMuted ? 'Unmute' : 'Mute'}</span>
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <button onClick={endCall} className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/30 hover:bg-red-600 active:scale-95 transition-all">
                  <Phone className="h-6 w-6 sm:h-7 sm:w-7 rotate-[135deg]" />
                </button>
                <span className="text-[10px] text-gray-500 uppercase">End</span>
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <button onClick={() => setIsSpeakerOff(!isSpeakerOff)} className={`h-12 w-12 sm:h-14 sm:w-14 rounded-full flex items-center justify-center transition-all ${isSpeakerOff ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>
                  {isSpeakerOff ? <VolumeX className="h-5 w-5 sm:h-6 sm:w-6" /> : <Volume2 className="h-5 w-5 sm:h-6 sm:w-6" />}
                </button>
                <span className="text-[10px] text-gray-500 uppercase">{isSpeakerOff ? 'Unmute' : 'Speaker'}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── OUTGOING / ACTIVE VIDEO CALL (Instagram-style fullscreen) ─── */}
      <AnimatePresence>
        {(isCalling || activeCall) && callType === 'video' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] flex flex-col bg-black safe-area-inset"
          >
            {/* Remote video (fullscreen) */}
            {remoteStream ? (
              <video 
                autoPlay playsInline muted={isSpeakerOff}
                ref={(el) => { if (el && el.srcObject !== remoteStream) { el.srcObject = remoteStream; el.play().catch(() => {}); }}}
                className="absolute inset-0 w-full h-full object-cover z-0" 
              />
            ) : (
              /* Waiting screen with profile */
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 via-black to-gray-900 z-0">
                <div className="relative mb-4 sm:mb-6">
                  <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-4xl sm:text-5xl font-bold shadow-2xl">
                    {getInitial(remoteUser?.name || '')}
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-30" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">{remoteUser?.name || 'Unknown'}</h2>
                <p className="text-gray-400 text-xs sm:text-sm font-medium tracking-widest uppercase mt-2">Calling...</p>
              </div>
            )}

            {/* Header overlay */}
            <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between z-20 bg-gradient-to-b from-black/60 to-transparent">
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-bold text-white drop-shadow-lg">{remoteUser?.name || 'Unknown'}</span>
                <span className="text-xs sm:text-sm font-medium drop-shadow-lg">
                  {isConnected ? (
                    <span className="text-emerald-400 font-mono">{timer}</span>
                  ) : (
                    <span className="text-gray-300 tracking-wider">Calling...</span>
                  )}
                </span>
              </div>
            </div>

            {/* Local video PiP */}
            {localStream && (
              <div className="absolute top-16 sm:top-20 right-3 sm:right-4 w-24 h-36 sm:w-36 sm:h-52 bg-gray-900 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 z-20">
                <video 
                  autoPlay playsInline muted 
                  ref={(el) => { if (el && el.srcObject !== localStream) { el.srcObject = localStream; el.play().catch(() => {}); }}}
                  className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : 'block'}`}
                  style={{ transform: 'scaleX(-1)' }}
                />
                {isVideoOff && (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <CameraOff className="h-6 w-6 sm:h-8 sm:w-8 text-gray-500" />
                  </div>
                )}
              </div>
            )}

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 flex justify-center items-center gap-3 sm:gap-6 z-20 bg-gradient-to-t from-black/70 to-transparent">
              <div className="flex flex-col items-center gap-1">
                <button onClick={toggleMute} className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-white text-black' : 'bg-white/15 text-white backdrop-blur-md'}`}>
                  {isMuted ? <MicOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Mic className="h-4 w-4 sm:h-5 sm:w-5" />}
                </button>
                <span className="text-[9px] sm:text-[10px] text-white/60">{isMuted ? 'Unmute' : 'Mute'}</span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <button onClick={toggleVideo} className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center transition-all ${isVideoOff ? 'bg-white text-black' : 'bg-white/15 text-white backdrop-blur-md'}`}>
                  {isVideoOff ? <CameraOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Video className="h-4 w-4 sm:h-5 sm:w-5" />}
                </button>
                <span className="text-[9px] sm:text-[10px] text-white/60">Camera</span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <button onClick={flipCamera} className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/15 text-white backdrop-blur-md flex items-center justify-center transition-all hover:bg-white/25">
                  <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
                <span className="text-[9px] sm:text-[10px] text-white/60">Flip</span>
              </div>
              
              <div className="flex flex-col items-center gap-1">
                <button onClick={() => setIsSpeakerOff(!isSpeakerOff)} className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center transition-all ${isSpeakerOff ? 'bg-white text-black' : 'bg-white/15 text-white backdrop-blur-md'}`}>
                  {isSpeakerOff ? <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" /> : <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />}
                </button>
                <span className="text-[9px] sm:text-[10px] text-white/60">Speaker</span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <button onClick={endCall} className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/30 hover:bg-red-600 active:scale-95 transition-all">
                  <Phone className="h-5 w-5 sm:h-6 sm:w-6 rotate-[135deg]" />
                </button>
                <span className="text-[9px] sm:text-[10px] text-white/60">End</span>
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
