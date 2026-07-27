'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Phone, Video, X, Mic, MicOff, Volume2, VolumeX, Camera, CameraOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type CallType = 'audio' | 'video';

interface CallContextType {
  startCall: (targetUserId: string, targetUserName: string, type: CallType) => void;
  endCall: () => void;
  isCalling: boolean;
  activeCall: any;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const [peer, setPeer] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [activeCall, setActiveCall] = useState<any>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [callType, setCallType] = useState<CallType>('audio');
  
  const [remoteUser, setRemoteUser] = useState<{ id: string; name: string } | null>(null);

  // New State-based stream handling
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // Toggles
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false); // Basically muting incoming audio

  useEffect(() => {
    let callChannel: any = null;

    const initPeerAndSignaling = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const myId = session.user.id;
      setCurrentUserId(myId);

      // Supabase Signaling Channel for robust hangups
      callChannel = supabase.channel(`call_signals_${myId}`)
        .on('broadcast', { event: 'CALL_END' }, () => {
           console.log("Received CALL_END broadcast");
           forceCleanup();
        })
        .subscribe();

      import('peerjs').then(({ default: PeerClass }) => {
        const newPeer = new PeerClass(myId, {
           config: {
              iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:global.stun.twilio.com:3478' }
              ]
           }
        });
        
        newPeer.on('call', async (call: any) => {
          const { data: callerData } = await supabase.from('users').select('name').eq('id', call.peer).single();
          setRemoteUser({ id: call.peer, name: callerData?.name || 'Unknown User' });
          setIncomingCall(call);
          setCallType(call.metadata?.type || 'audio');

          call.on('close', forceCleanup);
          call.on('error', forceCleanup);
        });

        newPeer.on('error', (err: any) => {
          console.error("PeerJS Error:", err);
        });

        setPeer(newPeer);
      }).catch(err => console.error("PeerJS import error", err));
    };

    initPeerAndSignaling();

    return () => {
      if (peer) peer.destroy();
      if (callChannel) supabase.removeChannel(callChannel);
    };
  }, []);

  const forceCleanup = () => {
    setActiveCall((oldCall: any) => {
       if (oldCall) oldCall.close();
       return null;
    });
    setIncomingCall((oldIncoming: any) => {
       if (oldIncoming) oldIncoming.close();
       return null;
    });
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
        type: 'broadcast',
        event: 'CALL_END',
        payload: {}
     });
  };

  const startCall = async (targetUserId: string, targetUserName: string, type: CallType) => {
    if (!peer) return alert("Call system is disconnected. Please refresh.");
    try {
      setIsCalling(true);
      setCallType(type);
      setRemoteUser({ id: targetUserId, name: targetUserName });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' });
      setLocalStream(stream);
      
      const call = peer.call(targetUserId, stream, { metadata: { type } });
      
      call.on('stream', (rStream: any) => setRemoteStream(rStream));
      call.on('close', forceCleanup);
      call.on('error', forceCleanup);
      
      setActiveCall(call);
    } catch (err) {
      console.error("Failed to start call", err);
      alert("Could not access camera/microphone.");
      forceCleanup();
    }
  };

  const answerCall = async () => {
    if (!incomingCall) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callType === 'video' });
      setLocalStream(stream);

      incomingCall.answer(stream);
      
      incomingCall.on('stream', (rStream: any) => setRemoteStream(rStream));
      incomingCall.on('close', forceCleanup);
      incomingCall.on('error', forceCleanup);
      
      setActiveCall(incomingCall);
      setIncomingCall(null);
    } catch(err) {
       console.error("Failed to answer", err);
       alert("Could not access camera/microphone to answer.");
       forceCleanup();
    }
  };

  const rejectCall = () => {
    if (incomingCall) notifyRemoteEnd(incomingCall.peer);
    forceCleanup();
  };

  const endCall = () => {
    if (remoteUser?.id) notifyRemoteEnd(remoteUser.id);
    forceCleanup();
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
         audioTrack.enabled = !audioTrack.enabled;
         setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream && callType === 'video') {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
         videoTrack.enabled = !videoTrack.enabled;
         setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  return (
    <CallContext.Provider value={{ startCall, endCall, isCalling, activeCall }}>
      {children}
      
      {/* Hidden Audio Elements for Audio Calls */}
      {callType === 'audio' && localStream && (
         <audio muted autoPlay ref={(el) => { 
            if (el && el.srcObject !== localStream) {
               el.srcObject = localStream;
               el.play().catch(e => console.warn("Local audio play blocked:", e));
            }
         }} className="hidden" />
      )}
      {callType === 'audio' && remoteStream && (
         <audio autoPlay muted={isSpeakerOff} ref={(el) => { 
            if (el && el.srcObject !== remoteStream) {
               el.srcObject = remoteStream;
               el.play().catch(e => console.warn("Remote audio play blocked:", e));
            }
         }} className="hidden" />
      )}

      {/* Global Incoming Call Modal */}
      <AnimatePresence>
        {incomingCall && !activeCall && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
             <motion.div 
               initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
               className="w-full max-w-sm rounded-3xl border border-[var(--border-color-strong)] bg-[var(--bg-panel)] p-6 shadow-2xl flex flex-col items-center text-center"
             >
                <div className="h-24 w-24 rounded-full bg-[var(--bg-hover)] flex items-center justify-center mb-4 border border-[var(--border-color)] relative">
                   {callType === 'video' ? <Video className="h-10 w-10 text-emerald-500 animate-pulse relative z-10" /> : <Phone className="h-10 w-10 text-emerald-500 animate-pulse relative z-10" />}
                   <div className="absolute inset-0 rounded-full border border-emerald-500 animate-ping opacity-50"></div>
                </div>
                <h3 className="text-2xl font-bold text-[var(--text-strong)] mb-2">
                  Incoming {callType === 'video' ? 'Video' : 'Voice'} Call
                </h3>
                <p className="text-[var(--text-muted)] mb-8 text-lg">From {remoteUser?.name || 'Unknown'}</p>
                
                <div className="flex w-full gap-4">
                  <button onClick={rejectCall} className="flex-1 rounded-xl bg-red-500/20 text-red-500 hover:bg-red-500/30 font-bold py-4 transition-colors">
                    Decline
                  </button>
                  <button onClick={answerCall} className="flex-1 rounded-xl bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 font-bold py-4 transition-colors flex items-center justify-center gap-2">
                    {callType === 'video' ? <Video className="h-5 w-5" /> : <Phone className="h-5 w-5" />} Answer
                  </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Active Call Overlay (Audio Only) */}
      <AnimatePresence>
        {(isCalling || activeCall) && callType === 'audio' && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[9998] flex items-center gap-4 rounded-full border border-[var(--border-color-strong)] bg-black/90 px-6 py-3 shadow-2xl backdrop-blur-md min-w-[320px]"
          >
             <div className="flex items-center gap-3 w-full">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 shrink-0">
                  <Phone className="h-5 w-5" />
                  <div className="absolute inset-0 rounded-full border-2 border-emerald-500 animate-ping opacity-30"></div>
                </div>
                <div className="flex flex-col flex-1">
                   <span className="text-sm font-bold text-white truncate max-w-[100px]">{remoteUser?.name || 'Unknown'}</span>
                   <span className="text-xs text-emerald-400 font-medium tracking-wide uppercase">
                     {activeCall ? 'Connected' : 'Calling...'}
                   </span>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                   <button onClick={toggleMute} className={`p-2 rounded-full ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'} transition-colors`}>
                     {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                   </button>
                   <button onClick={() => setIsSpeakerOff(!isSpeakerOff)} className={`p-2 rounded-full ${isSpeakerOff ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'} transition-colors`} title="Mute/Unmute Speaker">
                     {isSpeakerOff ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                   </button>
                </div>

                <button 
                  onClick={endCall}
                  className="ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg"
                >
                  <Phone className="h-4 w-4 rotate-[135deg]" />
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Active Call Overlay (Video) */}
      <AnimatePresence>
        {(isCalling || activeCall) && callType === 'video' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[9998] flex flex-col bg-black/95 backdrop-blur-lg"
          >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex flex-col">
                <span className="text-xl font-bold text-white">{remoteUser?.name || 'Unknown'}</span>
                <span className="text-sm text-emerald-400 font-medium">
                  {activeCall ? 'Secure Video Call Connected' : 'Calling...'}
                </span>
              </div>
            </div>

            {/* Video Streams */}
            <div className="flex-1 relative w-full h-full flex items-center justify-center overflow-hidden">
              {/* Remote Video (Full Screen) */}
              {remoteStream && (
                 <video 
                   autoPlay 
                   playsInline
                   muted={isSpeakerOff}
                   ref={(el) => { 
                      if (el && el.srcObject !== remoteStream) {
                         el.srcObject = remoteStream;
                         el.play().catch(e => console.warn("Remote video play blocked:", e));
                      }
                   }}
                   className={`w-full h-full object-cover transition-opacity duration-500 ${activeCall ? 'opacity-100' : 'opacity-0'}`} 
                 />
              )}
              
              {!activeCall && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-32 w-32 rounded-full bg-emerald-500/20 flex items-center justify-center relative">
                    <Video className="h-12 w-12 text-emerald-500 animate-pulse relative z-10" />
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-500 animate-ping opacity-30"></div>
                  </div>
                </div>
              )}

              {/* Local Video (Picture-in-Picture) */}
              {localStream && (
                 <div className="absolute bottom-24 right-6 w-32 h-48 md:w-48 md:h-72 bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 z-20">
                   <video 
                     autoPlay 
                     playsInline
                     muted 
                     ref={(el) => { 
                        if (el && el.srcObject !== localStream) {
                           el.srcObject = localStream;
                           el.play().catch(e => console.warn("Local video play blocked:", e));
                        }
                     }}
                     className={`w-full h-full object-cover mirror ${isVideoOff ? 'hidden' : 'block'}`}
                     style={{ transform: 'scaleX(-1)' }}
                   />
                   {isVideoOff && (
                      <div className="w-full h-full flex items-center justify-center bg-gray-800">
                         <CameraOff className="h-8 w-8 text-gray-500" />
                      </div>
                   )}
                 </div>
              )}
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center items-center gap-6 z-20 bg-gradient-to-t from-black/80 to-transparent">
              <button onClick={toggleMute} className={`flex h-14 w-14 items-center justify-center rounded-full ${isMuted ? 'bg-white text-black' : 'bg-white/10 text-white'} hover:bg-white/20 transition-colors backdrop-blur-md border border-white/10`}>
                 {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </button>
              
              <button onClick={toggleVideo} className={`flex h-14 w-14 items-center justify-center rounded-full ${isVideoOff ? 'bg-white text-black' : 'bg-white/10 text-white'} hover:bg-white/20 transition-colors backdrop-blur-md border border-white/10`}>
                 {isVideoOff ? <CameraOff className="h-6 w-6" /> : <Camera className="h-6 w-6" />}
              </button>

              <button onClick={() => setIsSpeakerOff(!isSpeakerOff)} className={`flex h-14 w-14 items-center justify-center rounded-full ${isSpeakerOff ? 'bg-white text-black' : 'bg-white/10 text-white'} hover:bg-white/20 transition-colors backdrop-blur-md border border-white/10`} title="Mute/Unmute Remote Audio">
                 {isSpeakerOff ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
              </button>

              <button 
                onClick={endCall}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-2xl hover:scale-110 active:scale-95 ml-4"
              >
                <Phone className="h-8 w-8 rotate-[135deg]" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </CallContext.Provider>
  );
}

export const useCall = () => {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
