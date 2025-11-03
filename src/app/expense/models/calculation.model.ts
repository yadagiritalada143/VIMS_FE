
export interface CalculationModel {
  expense_amount: number;
  gst_tax: number;
  gst_tax_amount: number;
  gst_tax_amount_type: string;
  total_amount: number;
  total_msp_amount: number;
  total_tax_amount: number;
  vms_fee: number;
  vms_fee_amount: number;
  vms_fee_amount_type: string;
  vendor_amount_without_tax: number;
  vendor_amount_with_tax: number;
  msp_amount_with_tax: number;
  total_client_billable_amount: number;
  msp_partner_amount_with_tax: number;
  vms_amount_with_tax: number;
}


