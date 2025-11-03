export enum BillRate {
    ClientRate = 'client_bill_rate',
    VendorRate = 'vendor_bill_rate'
}

export interface TaxModel {
    amount_type: string;
    amount_value: string;
    entity_name: string;
    funded_by: string;
    entity_type: string;
    applicable_on: BillRate;
    slug?: string;
    amount?:number;
    calculated_on: BillRate;
}
