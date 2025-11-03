export enum Widget {
  ORG_CANDIDATE_CREDENTIAL = 'org_candidate_credential',
  CONFIGURE_CREDENTIALS = 'configure_credentials',
  CONFIGURE_ROLE_PERMISSIONS = 'configure_role_permissions',
}

export interface IRolePermissionWidget {
  createRole(roleName): void;
  updateRole(oldName, newName): void;
}

export interface IRolePermissionResp {
  status: string;
  errorMsg: string;
}