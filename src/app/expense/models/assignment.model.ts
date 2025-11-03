import { UserExpenseModel } from "./user-expence.model";

export interface AssignmentModel {
  id: string;
  title: string;
  code: string;
}

export interface AssignmentManager {
  email: string;
  id: string;
  initials: string;
  name: string;
  phone: any;
  role: any;
  username: string;
  avatar: any;
}

export interface AssignmentTitle {
  id: string;
  name: string;
}

export interface VedorOrganizationModel {
  id: string;
  industries: Array<any>;
  logo_url: string;
  name: string;
}

export interface UserId {
  email: string;
  id: string;
  initials: string;
  name: string;
  phone: any;
  role: any;
  username: string;
  avatar: any;
}

export interface Worker {
  candidate_id: AssignmentManager;
  classification: any;
  is_deleted: number;
  official_email: string;
  official_worker_id: string;
  original_start_date: string;
  source_id: any;
  source_type: string;
  sso_id: string;
  status: string;
  user: UserId;
  candidate: UserId;
}

export interface AssignmentDataModel {
  assignment_manager: AssignmentManager;
  assignment_title: AssignmentTitle;
  assignment_title_uuid: AssignmentTitle;
  assignment_uuid: string;
  code: string;
  end_date: string;
  evaluation: any;
  hierarchy: AssignmentTitle;
  initial: any;
  job_id: any;
  job_level: any;
  reasons: Array<any>;
  sourcing_model: string;
  start_date: string;
  status: string;
  tax: Array<any>;
  timezone: string;
  vendor_id: any;
  vendor_organization: VedorOrganizationModel;
  work_location: AssignmentTitle;
}

export interface AssignmentFinance {
  currency: string;
  days_per_week: number;
  doubletime_billrate: string;
  doubletime_payrate: string;
  doubletime_vendor_rate: string;
  estimated_tax: string;
  expense_budget: string;
  expense_manager: UserExpenseModel;
  gross_allocated_budget: string;
  is_billable: number;
  is_expense_enabled: number;
  is_timesheet_enabled: number;
  net_allocated_budget: string;
  ot_exempt_position: false
  overtime_billrate: string;
  overtime_budget: string;
  overtime_payrate: string;
  overtime_vendor_rate: string;
  rate_model: string;
  rate_type: string;
  regular_billrate: string;
  regular_payrate: string;
  regular_vendor_rate: string;
  shift_timing: string;
  st_hours: string;
  timesheet_budget: string;
  timesheet_manager: UserExpenseModel;
  timesheet_type: string;
  total_working_days: string;
}

export interface AssignmentDetails {
  assignment: AssignmentDataModel;
  created_at: string;
  created_by: AssignmentManager;
  custom: any;
  finance: AssignmentFinance;
  is_deleted: number;
  is_enabled: number;
  updated_at: string;
  updated_by: AssignmentManager;
  worker: Worker;
}