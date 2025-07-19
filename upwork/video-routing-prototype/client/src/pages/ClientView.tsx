import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';

export const ClientView = () => {
  const { clientUUID } = useParams();
  const [adminId, setAdminId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const API_URL = import.meta.env.VITE_SOCKET_URL;

  const vdoUrl = `https://vdo.ninja/?view=${clientUUID}&autoplay&nocontrols&cleanoutput&transparent=1&fullscreen=1&speakermute`;

  // Establish socket connection once
  useEffect(() => {
    if (!clientUUID) {
      console.error('[CLIENT] No clientUUID provided');
      return;
    }
    const socket = io(API_URL, {
      query: {
        role: 'client',
        uuid: clientUUID,
      },
    });

    socketRef.current = socket;

    socket.on('connect', () =>
      console.log(`[CLIENT] ✅ Socket connected: ${socket.id}`)
    );
    socket.on('disconnect', (reason) =>
      console.log(`[CLIENT] ❌ Socket disconnected: ${reason}`)
    );
    socket.on('connect_error', (err) =>
      console.error('[CLIENT] ⚠️ Connection error:', err.message)
    );

    // ✅ Listeners
    const handleYourId = (uuid: string) => {
      console.log('[CLIENT] 📥 yourId:', uuid);
      setClientId(uuid);
    };

    const handleAdminAssigned = (admin: string) => {
      console.log('[CLIENT] 📥 adminAssigned:', admin);
      if (typeof admin === 'string' && admin.length > 0) {
        setAdminId(admin);
      } else {
        setAdminId(null);
      }
    };

    socket.on('yourId', handleYourId);
    socket.on('adminAssigned', handleAdminAssigned);

    return () => {
      console.log('[CLIENT] 🧹 Cleaning up...');
      socket.disconnect();
      socket.off();
    };
  }, [clientUUID]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      <iframe
        src={vdoUrl}
        title={`Client ${clientUUID} - Stream`}
        className="fixed top-0 left-0 w-screen h-screen border-none"
        allow="autoplay; fullscreen; camera; microphone"
        allowFullScreen
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
      />
      <div className="absolute top-4 right-40 z-20">
        <span className="text-white text-3xl font-bold italic bg-black bg-opacity-50 px-8 py-4 rounded">
          {adminId ? `Admin: ${adminId}` : 'En attente d’un admin...'}
        </span>
      </div>
    </div>
  );
};
