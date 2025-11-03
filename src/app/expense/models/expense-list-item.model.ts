
export interface ExpenseListModel {
  expense: ExpenseListItemModel[];
  totalAmount: { amount: number, currency: string };
}


export interface ExpenseListItemModel {
  expense_id: string;
  expense_detail_id: string;
  expensetype: {
    title: string;
    icon: string;
  };
  dateincurred: string;
  attachment: any;
  notes: string;
  totalamount: { amount: number, currency: string };
  created_at: any;
  updated_at: any;
  expense_category: any;
}

