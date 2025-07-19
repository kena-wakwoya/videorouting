export type Role = 'client' | 'admin';

export interface ConnectedSocket {
  id: string;
  role: Role;
}

export interface ClientInfo {
  id: string;
  assignedAdmin?: string;
}
