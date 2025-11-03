import { VMSConfig } from '../../../library/smartTable/table/table.model';

export interface Records {
    totalRecords?: number,
    limitRecords?: number,
    flowsData?: Array<flowType>,
    noOfPages?: number,
    pageNo?: number,
    activeFilters?: boolean,
    filterData?: flowType
}

export interface flowType {
    id?: string,
    is_enabled?: boolean,
    name?: string,
    modules?: any,
    flow_type?: string,
    modified_on?: any,
    code?: string,
    events?: any
}


export const tableConfig: VMSConfig = {
    title: 'Workflows',
    columnList: [
        { name: 'code', title: 'Id', isIcon: true, isImage: true, isContact: false, isNumberBadge: false, isVieworEditFlow: true, isDeleteFlow: true },
        { name: 'is_enabled', title: 'Status', isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'name', title: 'Title', isIcon: false, isImage: true, isContact: false, isNumberBadge: false},
        { name: 'modules', title: 'Module', isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'events', title: 'Event Name', isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'flow_type', title: 'Method', isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'modified_on', title: 'Last Updated', isIcon: false, isImage: false, isContact: false, isNumberBadge: false }
    ],
    isExpand: false,
    isFilter: true,
    isSearch: true,
    isSetting: false,
    isTopPagination: false,
    isDownload: false,
    isCreate: true,
    density: 'COMFORTABLE',
    advanceFilter: [
        {
          name: 'code',
          title: 'Id',
          filterType: 'TEXT',
          placeholder: 'Enter Text'
        },
        {
          name: 'name',
          title: 'Title',
          filterType: 'TEXT',
          placeholder: 'Enter Text'
        },
        {
            name: 'is_enabled',
            title: 'Status',
            filterType: 'SELECT',
            placeholder: 'Select Status',
            multiSelectData: [
                { name: 'Active', value: true },
                { name: 'InActive', value: false },
            ],
        },
        {
            name: 'modules',
            title: 'Module',
            filterType: 'SELECT',
            placeholder: 'Select Module',
            multiSelectData: [],
            hasDependency: true,
            dependentFieldName: 'events'
        },
        {
            name: 'events',
            title: 'Events',
            filterType: 'SELECT',
            placeholder: 'Select Events',
            multiSelectData: [],
            hasDependency: true,
            dependentFieldName: 'flow_type'
        },
        {
            name: 'flow_type',
            title: 'Method',
            filterType: 'SELECT',
            placeholder: 'Select Method',
            multiSelectData: [],
        },
        {
            name: 'modified_on',
            title: 'Last updated',
            placeholder: 'Choose Date Range',
            filterType: 'DATERANGE',
        }
    ]
};
