import { VMSConfig } from '../../../../library/table/table/table.model';


export const ExpenseConfigurationTableModel: VMSConfig = {
    title: 'Expense Configuration List',
    columnList: [
        { name: 'config_name', title: 'Expense Configuration Name', width: 20, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, },
        { name: 'hierarchy_title', title: 'Hierarchy', width: 20, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'updated_by', title: 'Updated By', width: 25, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        {
            name: 'status', title: 'Status', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false,
            isVieworEdit: true, isDisableorDelete: true,
            // add below option to enable config deletion
            // isDelete: true
        }
    ],
    isExpand: false,
    isFilter: true,
    isSearch: true,
    isSetting: true,
    isTopPagination: true,
    isCreate: true,
    isCreateButtonName: 'Create new',
    density: 'COMFORTABLE',
    advanceFilter: [
        { name: 'config_name', title: 'Expense Configuration Name', filterType: 'TEXT' },
        {
            name: 'is_enabled', title: 'Status', filterType: 'SELECT', multiSelectData: [
                { name: 'Active', value: true },
                { name: 'Inactive', value: false }
            ]
        }
    ]
};
