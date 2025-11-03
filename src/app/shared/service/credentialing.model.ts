export interface RoleEvent {
  type: RoleEventType;
  name: string;
  newName?: string;
}

export enum RoleEventType {
  CREATE_ROLE = 'create_role',
  UPDATE_ROLE = 'update_role',
}

export enum CredentialingPermissions {
  VIEW_CREDENTIALING = 'view_credentialing',
}