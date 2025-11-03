import { ColumnConfig } from '../../../library/smartTable/table/table.model';
import { VMSConfig, AdvanceFiltter } from '../../../library/smartTable/table/table.model';


export const advanceFilter: AdvanceFiltter[] = [
    {
        name: 'worker_name',
        title: 'Worker Name',
        filterType: 'TEXT',
    },
    {
        name: 'email',
        title: 'Email Name',
        filterType: 'TEXT'
    },
    {
        name: 'assignment_manager',
        title: 'Start date',
        filterType: 'TEXT',
    },
    {
        name: 'vendor',
        title: 'Vendor',
        filterType: 'TEXT',
    },
    {
        name: 'po_number',
        title: 'Po Number',
        filterType: 'TEXT',
    },
    {
        name: 'project_name',
        title: 'Project Name',
        filterType: 'TEXT',
    },
    {
        name: 'bill_rate',
        title: 'Bill Rate',
        filterType: 'TEXT',
    },
    {
        name: 'start_date',
        title: 'Start Date',
        filterType: 'DATERANGE',
    },
    {
        name: 'end_date',
        title: 'End Date',
        filterType: 'DATERANGE',
    },
    {
        name: 'location_name',
        title: 'Location Name',
        filterType: 'TEXT',
    },
    {
        name: 'status',
        title: 'Status',
        filterType: 'SELECT',
        multiSelectData: [
            { value: 'active', name: 'Open' },
            { value: 'closed', name: 'Closed' },
            { value: 'evaluate', name: 'Pending Evaluation' },
            { value: 'upcoming_closure', name: 'Assignment Ending In 30 Days' },
            { value: 'pending-onboarding', name: 'Pending Onboarding' }
        ]
    }
];

export const ReportsDetailsTableModel: VMSConfig = {
    formatColumns:{numericTypeColumns: [], amountTypeColumns: []},
    title: '',
    columnList: [],
    tabsList: ['All', 'Approved', 'Pending', 'Rejected'],
    showTabs: false,
    isExpand: true,
    isFilter: false,
    isSearch: true,
    isSetting: false,
    isTopPagination: true,
    isTopHeader: true,
    isCreate: false,
    isSort: true,
    density: 'COMFORTABLE',
    isIdDifferent: true,
    differentId: 'assignment_uuid',
    advanceFilter
};

export const ReportsDetailsColumnModel: ColumnConfig = {
    name: '',
    title: '',
    isIcon: false,
    isImage: false,
    isContact: false,
    isNoOption: false,
    isNumberBadge: false,
    isSort: true,
};
