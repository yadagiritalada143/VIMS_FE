export class AccountCodeData {
    is_validated: boolean;
    account_code: string;
    account_title: string;
    fields: Array<AccountCodeFields>;
}

export class AccountCodeFields {
    foundational_data_type_id: string;
    slug: string;
    key_slug: string;
    foundation_data_id: string;
    value: { name: string, code: string }
}
