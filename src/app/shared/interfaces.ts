import { Theme, SidebarPosition, ApprovalStatus, ExpenseStatus } from "./enums";

export interface Settings {
  theme: Theme;
  sidebarVisible: boolean;
  sidebarPosition: SidebarPosition;
}

export interface StatusMessageData {
  status: ApprovalStatus | ExpenseStatus;
  updated_by: any;
  delegation: any;
  impersonation: any;
  date: any;
  reason?: string;
  notes?: string;
  is_archive?: string;
  approve_reject_by?: string;
  modification_by:string;
  modification_at:any;
  modification_reason?:string;
  modification_note?:string;
  isModified: boolean;
  action?: any;
  icon_src?: string;
}

export interface multiWorkflow {
  name?: string;
  api_url?: string;
  data?: any;
  status?: string;
  workflow_type?: string;
  isDisabled?: boolean;
  isReplaceMember?: boolean;
  isOnlyReplaceUsersFromWorkflow?: boolean
}