export enum TimesheetStatus {
    DRAFT= 'draft',
    WITHDRAWN = 'withdrawn',
    PENDING = 'pending',
    REJECTED = 'rejected',
    APPROVED = 'approved',
    MISSING = 'missing',
    DEFERRED = 'deferred',
    DELETED = 'deleted',
    APPROVED_MODIFIED= 'approved - modified',
    IN_PROGRESS = 'in-progress', 
    BULK_PENDING= 'bulk-pending'
}

export enum DATE_FORMAT {
    FORMATYMD = 'YYYY-MM-DD',
    FORMATDMMY = 'DD MMM yyyy',
    FORMATMDY = 'MM/DD/YYYY',
    FORMATDDMMYY = 'DD/MM/YYYY',
    FORMATMMDDYY = 'MM-DD-YYYY',
    FORMATYYMMDD = 'YYYY/MM/DD'
}

export enum ActionAlertType {
    ARCHIVE = 'archive'
}
export enum TimesheetWorkWeekDays{
  monday= 'sunday',
  tuesday= 'monday',
  wednesday= 'tuesday',
  thursday= 'wednesday',
  friday= 'thursday',
  saturday= 'friday',
  sunday= 'saturday'
}

export enum TimesheetWeeklyType {
    MANUAL= 'manual',
    AUTOMATIC= 'automation',
    HYBRID= 'hybrid',
}

export enum TimesheetSupportingTextEvent {
    SUBMIT_EVENT= 'submit_timesheet',
    APPROVE_EVENT = 'approve_timesheet',
    VIEW_EVENT = 'view_timesheet'
}

export enum TimesheetType {
    MONTHLY= 'monthly',
    WEEKLY= 'weekly',
    TITO= 'tito',
    CICO= 'cico',
    HOURS= 'hours',
    DAY = 'days'
}

export enum TimesheetGracePeriod {
    DAY= 'day',
    MONTH= 'month',
    WEEK= 'week',
    HOUR= 'hour'
}

export enum TimesheetWorkType {
    REGULAR= 'regular',
    OVERTIME= 'overtime',
    DOUBLETIME= 'doubletime',
    ALL= 'total'
}


export enum TimesheetWorkTypeAbbreviation {
    REGULAR= 'ST',
    OVERTIME= 'OT',
    DOUBLETIME= 'DT'
}

export enum TimesheetRoutes {
    LIST_ROUTE= '/timesheet/list/all',
    MONTHLY_ENTRY_ROUTE = '/timesheet/entry',
    MONTHLY_HOUR_BASED_ENTRY_ROUTE= '/timesheet/hourly-timesheet/month',
    AUTOMATIC_WEEKLY_ENTRY_ROUTE = '/timesheet/hourly-timesheet/automation',
    AUTOMATIC_DAY_ENTRY_ROUTE = '/timesheet/day-timesheet/automation',
    MANUAL_WEEKLY_ENTRY_ROUTE = '/timesheet/hourly-timesheet/manual'
}

export enum AccountCodeStatus {
    ACTIVE= 'Active',
    INACTIVE= 'In-active'
}

export enum HoursDefaultValues {
    'hh:mm'= '00:00',
    'hh:mm:ss'= '00:00:00',
    'actual_decimal'= '0.00',
    'lowest_decimal'= '0.00, 0.25, 0.50, 0.75',
}


export enum HoursTypes {
    HOURS_MINS= 'hh:mm',
    HOURS_MINS_SECS= 'hh:mm:ss'
}

export enum DecimalTypes {
    ACTUAL_DECIMAL= 'actual_decimal',
    LOWEST_DECIMAL = 'lowest_decimal' 
}
export enum Permissions {
    ADMIN_OVERRIDE_ON_APPROVAL= 'admin_override_on_approval'
}

export enum UsersType {
    MSP = 'MSP',
    CLIENT = 'CLIENT',
    SUPER_ORG = 'SUPER_ORG',
    VENDOR = 'VENDOR',
    CANDIDATE=  'CANDIDATE',
    WORKER= 'WORKER'
}

export enum HoursInputType{
    DECIMAL= 'decimal',
    HOUR= 'hour'
}
export const TimesheetConstants= {
    PROJECT_APPENDER: " - ",
    TIMESHEET: "timeSheetData",
    REGEX: {
        hour:{
            'hh:mm':/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
            '24':/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
            '12':/^(1[0-2]|0?[1-9]):[0-5][0-9] (AM|PM)$/,
            'hh:mm:ss':/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/,
        },
        decimal:  {
        'actual_decimal': /^\d*(\.\d+)?$/,
       // 'lowest_decimal': /^\d*(\.\d+)?$/,
        'lowest_decimal': /^\d*\.(0|00|25|5|50|75)?$/
        },
    },
    HIRING_MANAGER_ROLE: 'hiring manager'
}
