export const HistoryDetailConfig: { label: string; key: string, nested_key?: string, is_period?: boolean }[] = [
    {
        label: 'Expense Configuration Name',
        key: 'config_name'
    },
    {
        label: 'Hierarchy',
        key: 'hierarchy_uuid'
    },
    {
        label: 'Expense start date',
        key: 'expense_start_date'
    },
    {
        label: 'Expense active',
        key: 'is_active'
    },
    {
        label: 'Expense configuration enabled',
        key: 'expense_config',
        nested_key: 'is_expense'
    },
    {
        label: 'Expense is taxable',
        key: 'expense_config',
        nested_key: 'is_taxable'
    },
    {
        label: 'Remove Vendor Access to Enter General Expense',
        key: 'expense_config',
        nested_key: 'remove_vendor_access_general',
        is_period: true,
    },
    {
        label: 'Remove Worker Access to Enter General Expense',
        key: 'expense_config',
        nested_key: 'remove_worker_access_general',
        is_period: true,
    },
    {
        label: 'Remove Vendor Access to Enter Misc Expense',
        key: 'expense_config',
        nested_key: 'remove_vendor_access_misc',
        is_period: true,
    },
    {
        label: 'Remove MSP Access to Enter General Expense',
        key: 'expense_config',
        nested_key: 'remove_msp_access_general',
        is_period: true,
    },
    {
        label: 'Remove MSP Access to Enter Misc Expense',
        key: 'expense_config',
        nested_key: 'remove_msp_access_misc',
        is_period: true,
    },
    {
        label: 'Allow General Expense Incurred Submission',
        key: 'expense_config',
        nested_key: 'grace_period_submission',
        is_period: true,
    },
];

export const HistoryTypeConfig: { label: string; key: string }[] = [
    {
        label: 'Expense Category',
        key: 'expense_type'
    },
    {
        label: 'Expense Code',
        key: 'expense_code'
    },
    {
        label: 'Expense Name/Type',
        key: 'expense_name'
    },
    {
        label: 'Attachment Mandatory',
        key: 'attachment_mandatory'
    },
    {
        label: 'Notes Mandatory',
        key: 'notes_mandatory'
    },
    {
        label: 'Type is taxable',
        key: 'is_taxable'
    },
    {
        label: 'MSP Fee Applied',
        key: 'msp_applicable'
    },
    {
        label: 'Allow Neagtive Expense',
        key: 'allow_negative_expense'
    },
    {
        label: 'Status',
        key: 'status'
    }
];