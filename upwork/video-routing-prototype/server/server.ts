
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

const PORT = process.env.PORT || 4000;

type Role = 'admin' | 'client';

interface ClientInfo {
  uuid: string;
  socketId: string;
  assignedAdmin?: string;
}

// Interface for Admin Info
interface AdminInfo {
  adminId: string;      // e.g., "admin1", "admin2"
  socketId: string;
}

const clients: Record<string, ClientInfo> = {};
const roles: Record<string, Role> = {};
const onlineAdmins: Record<string, AdminInfo> = {}; 

io.on('connection', (socket) => {
  const role = socket.handshake.query.role as Role;
  const uuid = socket.handshake.query.uuid as string; 
  const adminId = socket.handshake.query.adminId as string; 

  roles[socket.id] = role;
  console.log(`[SERVER CONNECT] 🧩 ${role} connected: ${socket.id}`);

  if (role === 'client' && uuid) {
    const existingClient = clients[uuid];

    clients[uuid] = {
      uuid,
      socketId: socket.id,
      assignedAdmin: existingClient ? existingClient.assignedAdmin : undefined,
    };

    socket.emit('yourId', uuid);
    io.emit('clientsUpdate', clients); 

    if (clients[uuid].assignedAdmin) {
      console.log(`[SERVER EMIT INITIAL] Client ${uuid} connected with existing admin ${clients[uuid].assignedAdmin}.`);
      socket.emit('adminAssigned', clients[uuid].assignedAdmin);
    }
  } else if (role === 'admin' && adminId) {
    onlineAdmins[adminId] = {
      adminId: adminId,
      socketId: socket.id,
    };
    console.log(`[SERVER ADMIN CONNECT] Admin ${adminId} (socket ${socket.id}) is now online.`);
    
    // Broadcast updated list of online admins to all connected clients (especially other admins)
    io.emit('adminsUpdate', Object.values(onlineAdmins));
    
    // Send current clients to just the connecting admin
    io.emit('clientsUpdate', clients);

  } else {
    console.warn(`[SERVER CONNECT WARN] Unrecognized connection: role=${role}, uuid=${uuid}, adminId=${adminId}`);
  }

  socket.on('assignAdmin', ({ clientId, adminId }) => {
    console.log(`[SERVER ASSIGN_REQUEST] Admin requested assignment for Client ID: ${clientId}, Admin ID: ${adminId}`);

    if (clients[clientId]) {
      const targetClientSocketId = clients[clientId].socketId;
      clients[clientId].assignedAdmin = adminId;

      console.log(`[SERVER ASSIGN_EXECUTE] Client ${clientId} found. Current socketId: ${targetClientSocketId}. Assigned admin: ${adminId}.`);

      const targetSocket = io.sockets.sockets.get(targetClientSocketId);
      if (targetSocket) {
        console.log(`[SERVER EMIT REALTIME] Emitting 'adminAssigned' to client ${clientId} (socket ${targetClientSocketId}) with value: "${adminId}"`);
        io.to(targetClientSocketId).emit('adminAssigned', adminId);
      } else {
        console.error(`[SERVER EMIT REALTIME ERROR] Target socket ${targetClientSocketId} for client ${clientId} NOT FOUND or DISCONNECTED.`);
      }

      io.emit('clientsUpdate', clients); // Update all admins (client assignments)
    } else {
      console.warn(`[SERVER ASSIGN_WARN] Attempted to assign admin ${adminId} to unknown or disconnected client ${clientId}.`);
    }
  });


  socket.on('disconnect', () => {
    console.log(`[SERVER DISCONNECT] ❌ Disconnected: ${socket.id}`);
    const disconnectedRole = roles[socket.id];
    delete roles[socket.id];

    if (disconnectedRole === 'client') {
      const disconnectedClientUUID = Object.keys(clients).find(
        (uuid) => clients[uuid].socketId === socket.id
      );

      if (disconnectedClientUUID) {
        console.log(`[SERVER DISCONNECT] Client ${disconnectedClientUUID} is now offline.`);
        delete clients[disconnectedClientUUID];
        io.emit('clientsUpdate', clients);
      }
    }
    else if (disconnectedRole === 'admin') {
      // Log the state of onlineAdmins *before* trying to find and delete
      console.log(`[SERVER DEBUG DISCONNECT] Current onlineAdmins state before processing disconnect for socket ${socket.id}:`, Object.keys(onlineAdmins));

      const disconnectedAdminId = Object.keys(onlineAdmins).find(
        (adminId) => onlineAdmins[adminId].socketId === socket.id
      );
      if (disconnectedAdminId) {
        console.log(`[SERVER DISCONNECT] Admin ${disconnectedAdminId} (socket ${socket.id}) is now offline. Removing from onlineAdmins.`);
        delete onlineAdmins[disconnectedAdminId];
        io.emit('adminsUpdate', Object.values(onlineAdmins));
        // Log the state of onlineAdmins *after* processing disconnect
        console.log(`[SERVER DEBUG DISCONNECT] onlineAdmins state AFTER removal:`, Object.keys(onlineAdmins));
      } else {
        console.warn(`[SERVER DISCONNECT WARN] Disconnected socket ${socket.id} was an admin but its ID was not found in onlineAdmins. (Role: ${disconnectedRole})`);
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});