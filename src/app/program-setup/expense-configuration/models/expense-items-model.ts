export interface IExpensesItemsListResponse {
    status: number;
    message: string;
    code: string;
    error: string;
    data: IExpensesItemsListData;
}

export interface IExpensesItemsListData {
    total_records: number;
    current_page_result: number;
    per_page: number;
    current_page: number;
    last_page: number;
    first_page_url: string;
    last_page_url: string;
    next_page_url: string;
    prev_page_url: string;
    path: string;
    expenseItems: IExpensesItem[];
}



export interface IExpensesItem {
    expense_item_id: string;
    expense_icon: string;
    expense_code: string;
    attachment_mandatory: string;
    created_at: number;
    config_name: string;
    expense_name: string;
    expense_type: string;
    is_taxable: string;
    msp_applicable: string;
    notes_mandatory: string;
    program_id: string;
    status: string;
    updated_at: number;
    created_by: {
      email: string;
      name: string;
      id: string;
    };
  updated_by: {
      email: string;
      name: string;
      id: string;
    };
}

export interface IExpensesItemVmsData {
  id: string;
  code: string;
  expense_name: string;
  icon: string;
  // created_at: string;
  is_enabled: boolean;
  is_taxable: string;
}
