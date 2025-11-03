export enum UserType {
    Worker = 'CANDIDATE',
    Vendor = 'VENDOR',
    MSP = 'MSP',
    Client = 'CLIENT',
    Super_org = 'SUPER_ORG'
}

export enum FormDataTypes {
    Label = 'label',
    Dimension = 'dimension',
    ChartType = 'chartType',
    Options = 'options'
}

export enum FormGroupValidators {
    quick_link = '^[A-Z0-9]\.*$',
    lists = '^[A-Z0-9]\.*$',
    charts = '^[A-Z0-9]\.*$',
    calendars = '^[A-Z0-9]\.*$'
}
