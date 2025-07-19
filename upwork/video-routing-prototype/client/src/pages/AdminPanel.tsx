import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';

interface ClientInfo {
  uuid: string;
  socketId: string;
  assignedAdmin?: string;
}

interface AdminInfo {
  adminId: string;
  socketId: string;
}

export const AdminPanel = () => {
  const { adminId } = useParams();
  const [clients, setClients] = useState<Record<string, ClientInfo>>({});
  const [onlineAdmins, setOnlineAdmins] = useState<AdminInfo[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const API_URL = import.meta.env.VITE_SOCKET_URL;

  useEffect(() => {
    if (!adminId) {
      console.error('[ADMIN PANEL] No adminId provided');
      return;
    }
    const socket = io(API_URL, {
      query: {
        role: 'admin',
        adminId: adminId,
      },
    });

    socketRef.current = socket;


    socket.on('connect', () =>
      console.log(`[ADMIN PANEL] ✅ Socket Connected: ${socket.id}`)
    );
    socket.on('disconnect', () =>
      console.log('[ADMIN PANEL] ❌ Socket Disconnected!')
    );
    socket.on('connect_error', (err) =>
      console.error('[ADMIN PANEL] 🔌 Socket Connection Error:', err.message)
    );

    socket.on('clientsUpdate', (updated: Record<string, ClientInfo>) => {
      console.log('[ADMIN PANEL] clientsUpdate received:', updated);
      setClients(updated);
    });

    socket.on('adminsUpdate', (updatedAdmins: AdminInfo[]) => {
      console.log('[ADMIN PANEL] adminsUpdate received:', updatedAdmins);
      setOnlineAdmins(updatedAdmins);
    });

    return () => {
      console.log('[ADMIN PANEL] 🧹 Cleaning up socket...');
      socket.disconnect();
      socket.off();
    };
  }, [adminId]);

  const assign = (clientId: string, adminId: string) => {
    console.log(
      `[ADMIN PANEL] 📤 Requesting assignment: Client ${clientId} to Admin ${adminId}`
    );
    socketRef.current?.emit('assignAdmin', { clientId, adminId });
  };

  return (
    <div className="p-4 w-min-screen h-min-screen">
      <h1 className="text-xl font-bold mb-4 text-center">Panel Admin - Routage Vidéo</h1>

      <div className="mb-6 bg-blue-50 p-4 rounded-lg shadow-inner">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">
          Admins En Ligne ({onlineAdmins.length})
        </h2>
        <div className="flex flex-wrap gap-4">
          {onlineAdmins.map((admin) => (
            <span
              key={admin.adminId}
              className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm"
            >
              {admin.adminId}
            </span>
          ))}
        </div>
      </div>

      <table className="min-w-full border border-gray-200 shadow rounded overflow-hidden">
        <thead className="bg-gray-100 text-gray-800 text-sm uppercase tracking-wider">
          <tr>
            <th className="px-6 py-3 text-left">Client ID</th>
            <th className="px-6 py-3 text-center">Aperçu Vidéo</th>
            <th className="px-6 py-3 text-center">Admin Assigné</th>
            <th className="px-6 py-3 text-center">Changer</th>
          </tr>
        </thead>
        <tbody className="text-sm text-gray-700">
          {Object.entries(clients).map(([id, client], index) => {
            const rowBg = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
            let badgeColor = 'bg-gray-400';

            if (client.assignedAdmin?.startsWith('admin')) {
              const num = parseInt(client.assignedAdmin.replace('admin_', ''));
              if (!isNaN(num)) {
                badgeColor = num % 2 === 0 ? 'bg-green-500' : 'bg-blue-500';
              }
            }

            return (
              <tr key={id} className={`${rowBg} hover:bg-gray-100 transition`}>
                <td className="px-6 py-4 font-medium">{id}</td>
                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    {client.assignedAdmin ? (
                      <iframe
                        src={`https://vdo.ninja/?view=${client.uuid}&autostart`}
                        className="w-64 h-36 rounded border border-gray-300 shadow"
                        title={`Preview of ${client.uuid}`}
                        allow="autoplay; fullscreen"
                        allowFullScreen
                      />
                    ) : (
                      <span className="text-gray-400 italic">En attente</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  {client.assignedAdmin ? (
                    <span
                      className={`px-14 py-3 rounded-full text-xs font-semibold text-white ${badgeColor}`}
                    >
                      {client.assignedAdmin}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">En attente</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <select
                    defaultValue={client.assignedAdmin || ''}
                    onChange={(e) => assign(id, e.target.value)}
                    className="px-6 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    <option disabled value="">
                      Choisir Admin
                    </option>
                    {onlineAdmins.map((admin) => (
                      <option key={admin.adminId} value={admin.adminId}>
                        {admin.adminId}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
