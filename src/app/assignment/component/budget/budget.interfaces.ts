export interface IBudget {
  expense_pending_approval: string | number;
  initial_allocated_budget: string | number;
  later_allocated_budget: string | number;
  left_budget: string | number;
  timesheet_pending_approval: string | number;
  total_allocated_budget: string | number;
  total_pending_approval: string | number;
  total_spend: string | number;
  total_spend_expenses: string | number;
  total_spend_timesheet: string | number;
  is_lock: Boolean;
  over_spend: string | number;
  sow_milestone_balance :string | number;
}

export interface IBudgetChartItem {
  amount: string | number;
  label: string;
}

export interface IBudgetChartColor {
    label: string;
    color: string;
}
