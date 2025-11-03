export interface IExpenseConfig {
  custom_fields: any;
  grace_period_submission: { type: string; value: any };
  is_expense: boolean;
  is_taxable: boolean;
  remove_msp_access_general: { type: string; value: any };
  remove_msp_access_misc: { type: string; value: any };
  remove_vendor_access_general: { type: string; value: any };
  remove_vendor_access_misc: { type: string; value: any };
  remove_worker_access_general: { type: string; value: any };
  exp_amnt_based_on_role: {
    is_enabled: boolean,
    value: any,
  },
}

export interface IExpenseConfigData {
  config_name: string;
  config_uuid: string;
  created_at: number;
  created_by: { id: string; name: string; email: string };
  expense_config: IExpenseConfig;
  expense_start_date: number;
  hierarchy: { id: string; title: string };
  program_id: string;
  status: string;
  updated_at: number;
  updated_by: { id: string; name: string; email: string };
}
