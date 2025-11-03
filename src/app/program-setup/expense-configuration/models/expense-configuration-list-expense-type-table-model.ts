import {VMSConfig} from '../../../library/table/table/table.model';


export const ExpenseConfigurationItemDetailsTabsModel = {
  generalExpenses: { name: 'General Expense(s)', filter: 'expense-items' },
  miscellaneousExpenses: { name: 'Miscellaneous Expenses', filter: 'miscexpense-items' },
  history: { name: 'History', filter: 'history' },
};

export const ExpenseConfigurationListExpenseTypeTableModel: VMSConfig = {
  columnList: [
    { name: 'code', title: 'Code', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
    { name: 'expense_name', title: 'Expense Name', width: 20, isIcon: false, isImage: false, isContact: false,
      isNumberBadge: false },
    { name: 'icon', title: 'Expense Icon', width: 15, isIcon: false, isImage: false ,  isContact: false, isNumberBadge: false,
      isIconSrc: true },
    { name: 'created_at', title: 'Created by date time', width: 25, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
    { name: 'is_enabled', title: 'Status', width: 25, isIcon: false, isImage: false, isContact: false, isVieworEdit: true,
      isNumberBadge: false, isDisableorDelete: true }
  ],
  density: 'COMFORTABLE',
  isExpand: false,
  isFilter: false,
  showTabs: false,
  hideHeader: true,
  hideResultCount: true,
  hideBottomPagination: true,
  advanceFilter: [
    { name: 'name', title: 'Qualification', filterType: 'TEXT'},
    { name: 'is_enabled', title: 'Status', filterType: 'SELECT', multiSelectData: [
        {name: 'ACTIVE', value: true },
        {name: 'INACTIVE', value: false }
      ]},
    { name: 'modified_on', title: 'Date Updated range', filterType: 'DATERANGE'},
  ]
};
