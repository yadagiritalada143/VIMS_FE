export enum Theme {
  Light = 'light',
  Dark = 'dark',
}
export enum ApprovalStatus {
  approved = 'approved',
  pending = 'pending',
  rejected = 'rejected',
  not_needed = 'not needed'
}
export enum ExpenseStatus {
  withdrawn = 'withdrawn',
  modified = 'approved modified',
  pending = 'pending approval',
  pending_review = 'pending review',
  draft = 'draft',
  deleted = 'deleted',
}
export enum TimesheetStatus {
  withdrawn = 'withdrawn',
  modified = 'approved - modified',
  deleted = 'deleted',
}
export enum StatusMessageTypes {
  Expense = 'Expense',
  Timesheet = 'Timesheet',
  Assignment = 'Assignment',
  Job = 'Job',
  Mtp = 'Mtp'
}
export enum OrgTypes {
  TYPE_VENDOR = 'TYPE_VENDOR',
  TYPE_CLIENT = 'TYPE_CLIENT',
  TYPE_MSP = 'TYPE_MSP',
}

export enum BASIC_FIELD_TYPES {
  textfield = 'textfield',
  phone = 'phone',
  time = 'time',
  date = 'date',
  dropdown = 'dropdown',
  checkbox = 'checkbox',
  radio = 'radio',
  toggle = 'toggle',
  textarea = 'textarea',
  number = 'number',
  email = 'email',
  file = 'file',
  currency = 'currency',
  hyperlink = 'hyperlink',
  heading = 'heading',
  subheading = 'subheading',
}

export enum SidebarPosition {
  Left,
  Right,
}

export enum UserDataObj {
  Token,
  UserData,
  Usertheme,
  UserLanguage,
  UserWrongCredentials,
  UserSideBar,
  UserTooltip,
  UserPreferredTimeZone
}

export enum Usersetup {
  formstages,
}

export enum ProgramConfig {
  NewProgramData,
  ProgramId,
  clientId,
  program_req_id,
  clientName,
  ProgramObj,
}

export enum ClientData {
  ClientData,
}

export enum HierarchyConfig {
  HIERARCHY_CONFIG,
}
export enum BreadcrumEvents {
  PUSH,
  POP,
}

export enum StorageConfig {
  ORG_ID,
  PROGRAM_ID,
  CurrentProgram,
  ProgramList,
  ProgramObj,
}
export enum assignmentStatus {
  CLOSED = 'closed',
  OPEN = 'open'
};
export enum JobStatus {
  PENDING_APPROVAL = 'pending_approval',
  PENDING_APPROVAL_SOURCING = 'pending_approval_sourcing',
  ACTIVE = 'active_jobs',
  SOURCING = 'sourcing',
  OPEN = 'open',
  HOLD = 'hold',
  PENDING_APPROVAL_HOLD = 'pending_approval_hold',
  HALTED = 'halted',
  PENDING_APPROVAL_HALTED = 'pending_approval_halted',
  PENDING_REVIEW = 'pending_review',
  FILLED = 'filled',
  REJECTED = 'rejected',
  CLOSED = 'closed',
  DEFAULT = 'default',
  DRAFT = 'draft',
  APPROVED = 'approved',
  OFFER_CANCELLED='cancelled',
  PENDING_INTERVIEW_REVIEW='pending_interview_review',
  PENDING_ACCEPTANCE='PENDING_ACCEPTANCE',
  CANCELLED='cancelled',
  ACCEPTED='accepted',
  COMPLETED='completed',
  PENDING_OFFER_REVIEW='pending_offer_review',
  COUNTERED_PENDING_REVIEW='countered_pending_review',
  COUNTERED_PENDING_APPROVAL='countered_pending_approval',
  COUNTERED_CANCELLED='countered_cancelled',
  PENDING_INTERVIEW_ACCEPTANCE='PENDING_INTERVIEW_ACCEPTANCE',
  INTERVIEW_CANCELLED='cancelled',
  INTERVIEW_ACCEPTED='accepted',
  INTERVIEW_COMPLETED='completed',
  rejected = 'rejected',
  closed = 'closed',
  PENDING_CONFIRMATION = 'PENDING_CONFIRMATION'
}

export enum MtpStatus {
  action = 'action'
}

export enum UsersType {
  MSP = 'MSP',
  CLIENT = 'CLIENT',
  SUPER_ORG = 'SUPER_ORG',
  VENDOR = 'VENDOR',
  Super_org = 'SUPER_ORG'
}
export enum ReasonTypes {
  negative = 'unfavorable',
  neutral = 'neutral',
  positive = 'favorable',
}

export enum AmountType {
  percentage = 'percentage',
  fixed_amount = 'fixed_amount'
}
 export enum RATE_MODEL_PERMISSION {
  view_pay_rate_for_ = "view_pay_rate_for_",
  view_vendor_bill_rate_for_ = "view_vendor_bill_rate_for_",
  view_client_bill_rate_for_ = "view_client_bill_rate_for_",
  edit_pay_rate_for_ = "edit_pay_rate_for_",
  edit_vendor_bill_rate_for_ = "edit_vendor_bill_rate_for_",
  edit_client_bill_rate_for_ = "edit_client_bill_rate_for_"
 }

 export enum PAGE_ASSIGNMENENT {
  _page_assignment = "_page_assignment",
  _page_assignment_revision = "_page_assignment_revision"
 }

 export enum AccuracyConfigEnum {
  AMOUNT ="amount",
  AMOUNT_PERCENTAGE ="amount_percentage",
  FEE ="fee",
  FEE_PERCENTAGE ="fee_percentage",
  HOUR ="hour",
  MARKUP ="markup",
  MARKUP_PERCENTAGE="markup_percentage",
  RATE ="rate",
  TAX ="tax",
  TAX_PERCENTAGE ="tax_percentage",
  ADJUSTMENT ="adjustment"
 }

 export enum  CandidateIDFormatOptions { 
   FNMMDD = "FN-MM-DD",
   FFMMDD = "FF-MM-DD",
   LLMMDD = "LL-MM-DD",
   FFMMDDXXX = "FF-MM-DD-XXX",
   LLMMDDXXX = "LL-MM-DD-XXX",
   FFDDMM = "FF-DD-MM",
 }

 export enum AccessType {
  OWN = "OWN",
  ALL = "ALL",
  TRUE_OWN = "TRUE_OWN"
 }

 export enum RATE_MODEL {
  payrate = 'Pay Rate (Markup)',
  markup = 'Billrate (Markup)',
  billrate = 'Billrate (No Markup)'
 }