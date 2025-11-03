import { ApprovalManagerModel } from './approval-manager.model';
import { AssignmentManager, AssignmentModel } from './assignment.model';
import { CalculationModel } from './calculation.model';
import { UserExpenseModel } from './user-expence.model';
import { VendorOrganizationModel } from './vendor-organization.model';
import { HierarchyModel } from './hierarchy.model';
import { ExpenseDetailsModel } from './expense-details.model';
import { ExpenseStatusType } from '../interfaces/expense.interfaces';

export interface ExpenseModel {

  approval_manager: ApprovalManagerModel;
  approved_reject_date: any;
  approved_reject_notes: any;
  approved_reject_reason: any;
  approve_reject_by: string;
  assignment: AssignmentModel;
  assignment_manager: AssignmentManager;
  calculation: CalculationModel;
  created_by: UserExpenseModel;
  created_by_type: string;
  created_date: number;
  delete_allowed: boolean;
  delete_notes: string;
  delete_reason: string;
  expenseDetail: Array<ExpenseDetailsModel>;
  expense_code: string;
  expense_duration: string;
  expense_end_date: number;
  expense_id: string;
  expense_manager: UserExpenseModel[];
  expense_start_date: number;
  expense_status: ExpenseStatusType;
  expense_type: string;
  hierarchy: HierarchyModel;
  is_archive: string;
  is_modified_record: boolean;
  is_discard: boolean;
  msp_review: boolean;
  can_approve:boolean;
  is_budget_insufficient:boolean;
  modification_by:string;
  modification_at:any;
  modification_reason:string;
  modification_note:string;
  modify_notes: string;
  modify_reason: string;
  old_calculation: any;
  program_id: string;
  status_description: any;
  submitted_by: UserExpenseModel;
  submitted_by_type: any;
  submitted_date: any;
  total_expense_items: number;
  updated_by: UserExpenseModel;
  updated_by_type: string;
  updated_date: number;
  vendor_organization: VendorOrganizationModel;
  withdraw_notes: any;
  withdraw_on: any;
  withdraw_reason: any;
  work_location: { id: string, name: string };
  worker: UserExpenseModel;
  delegation: any;
  impersonation: any;
  worker_id: any;
  sourcing_model:any;
  actions_allow : any;
  can_perform_workflow:boolean,
  is_own_access: boolean,
  hybrid_fee_funded: boolean
  taxes: any;
}

