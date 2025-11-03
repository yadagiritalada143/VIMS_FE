export interface Tax {
    entity_name?: string;
    amount_type?: string;
    amount_value?: string;
    applicable_on?: string;
}

export interface Fee {
    entity_name: string;
    amount_type: string;
    amount_value: string;
    applicable_on: string;
}

export interface AssignmentCreateRequestdata {
    candidate_uuid: string;
    original_start_date: string;
    official_email: string;
    sso_id: string;
    source_type: string;
    source_id: string;
    classification: string;
    hierarchy_id: string;
    sourcing_model: string;
    job_id: string;
    assignment_title: string;
    job_level: string;
    job_hire_type?: string;
    work_location: string;
    start_date: string;
    end_date: string;
    assignment_manager: string;
    vendor_id: string;
    ot_exempt_position: any;
    is_timesheet_enabled: string;
    is_expense_enabled: string;
    timesheet_manager: string;
    expense_manager: string;
    timesheet_type: string;
    st_hours: number;
    days_per_week: number;
    is_billable: string;
    rate_model: string;
    rate_type: string;
    currency: string;
    tax_type?: string;
    regular_billrate: string;
    regular_payrate: string;
    regular_vendor_rate: string;
    overtime_billrate: string;
    overtime_payrate: string;
    overtime_vendor_rate: string;
    doubletime_billrate: string;
    doubletime_vendor_rate: string;
    location_id: string;
    cost_center: string;
    gl_code: string;
    business_unit: string;
    doubletime_payrate: string;
    timesheet_budget: string;
    overtime_budget: string;
    expense_budget: string;
    gross_allocated_budget: string;
    estimated_tax: string;
    net_allocated_budget: string;
    tax: Tax[];
    fee: Fee[];
    is_approval_workflow: boolean;
    is_account_required: boolean;
    notes_for_approver: string
}

export interface PicklistItem {
    id?: string;
    label?: string;
    is_enabled?: boolean;
}

export interface Picklist {
    total_records: number;
    items_per_page: number;
    picklist_items: PicklistItem[];
}

export interface CreatedBy {
    id: string;
    name_prefix: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    email: string;
    name_suffix: string;
}

export interface ModifiedBy {
    id: string;
    name_prefix: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    email: string;
    name_suffix: string;
}

export interface ReasonCode {
    id: string;
    name: string;
    source: string;
    created_on: any;
    modified_on: any;
    created_by: CreatedBy;
    modified_by: ModifiedBy;
    is_enabled: boolean;
}

export interface ReasonCodeResponce {
    total_records: number;
    items_per_page: number;
    reason_codes: ReasonCode[];
}

export interface Role {
    id: string;
    name: string;
}

export interface Task {
    id: string;
    name: string;
    task_type: string;
    description: string;
    role: Role;
    config: any;
    start_date: string;
    due_date: string;
    is_enabled: boolean;
    created_by: string;
    modified_by: string;
    created_on: string;
    modified_on: string;
}

export interface Tasks {
    order: number;
    task: Task;
    dependent_task?: Task;
}

export interface Checklist {
    id: string;
    name: string;
    description: string;
    job_templates: string[];
    tasks: Tasks[];
    is_enabled: boolean;
    created_by: string;
    modified_by: string;
    created_on: string;
    modified_on: string;
}

export interface ChecklistResponce {
    checklist: Checklist;
}
export interface RateVal {
  factor: any;
  rate_type: any;
  adjustment: any;
  adjustment_type: any;
}
export interface RateValWithEdit {
  is_edit: boolean;
  factor: any;
  rate_type: any;
  adjustment: any;
  adjustment_type: any;
}
export interface RateFactors {
  abbreviation: string;
  bill_rate: RateVal[];
  pay_rate: RateVal[];
  billable : Boolean;
  applicable : Boolean;
  markup?: any;
  cost_component?: any;
}
export interface RateFactorsWithEdit {
  abbreviation: string;
  bill_rate: RateValWithEdit[];
  pay_rate: RateValWithEdit[];
  billable : Boolean;
  applicable : Boolean;
  markup?: any;
  cost_component?: any;
}
export interface ArrayOfCustFields {
  name: any;
  code: any;
  showFields: any[];
}

export interface DependentCustomFields {
  label: any;
  id: any;
  customFieldsArray: ArrayOfCustFields[];
}
export interface RateFactorsShowHide {
  abbreviation: string;
  bill_rate: boolean;
  pay_rate: boolean;
}
