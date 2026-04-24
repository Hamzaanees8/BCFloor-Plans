import { api } from "@/lib/api";

export interface Permission {
  id: number;
  name: string;
  guard_name: string;
  created_at: string;
  updated_at: string;
}

export interface PermissionPayload {
  name: string;
}

export async function GetPermissions() {
  try {
    const response = await api.get('/permissions');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch permissions:', error);
    throw error;
  }
}

export async function CreatePermission(payload: PermissionPayload) {
  try {
    const response = await api.post('/permissions', payload);
    return response.data;
  } catch (error) {
    console.error('Failed to create permission:', error);
    throw error;
  }
}

export async function UpdatePermission(payload: PermissionPayload, id: number) {
  try {
    const response = await api.put(`/permissions/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error('Failed to update permission:', error);
    throw error;
  }
}

export async function DeletePermission(id: number) {
  try {
    const response = await api.delete(`/permissions/${id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete permission:', error);
    throw error;
  }
}
