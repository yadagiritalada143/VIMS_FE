interface TaxDetail {
    name: string;
    min_value: number;
    max_value: number;
    tax_type: 'PERCENTAGE' | 'FLAT';
    start_date: string;
    end_date: string;
    id?: string;
    id_deleted?: boolean;
};

export { TaxDetail };