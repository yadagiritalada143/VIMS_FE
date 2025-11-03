export interface IExpensesHistoryItemsListResponse {
    status: number;
    message: string;
    code: string;
    error: string;
    data: IExpensesHistoryItemsListData;
}

export interface IExpensesHistoryItemsListData {
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
    activities: IExpensesHistoryItems[];
}



export interface IExpensesHistoryItems {
    old: IExpensesHistoryItem;
    new: IExpensesHistoryItem;
    activity_by: {
       id: string;
      name: string;
      first_name: string;
      last_name: string;
      email: string;
      avatar: string;
      initials: string;
    };
    activity_time: number;
    log_id: string;
    log_name: string;
    history_message: string;
    revision: string;
}

export interface IExpensesHistoryItem {
  status: string;
  is_taxable: string;
  expense_code: string;
  expense_icon: string;
  expense_name: string;
  expense_type: string;
  program_uuid: string;
  msp_applicable: string;
  allow_negative_expense: string;
  notes_mandatory: string;
  expense_item_uuid: string;
  attachment_mandatory: string;
}
