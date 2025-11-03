export interface FoundationalData {
    id: string;
    name: string;
}

export interface Address {
    address_type: string;
    address_line1: string;
    address_line2: string;
    city: string;
    state: string;
    country: string;
    zipcode: string;
}

export interface ContactInfo {
    member_type: string;
    contact_name: string;
    title: string;
    contact_email: string;
    contact_phone: string;
}

export interface CreatedBy {
    id: string;
    name_prefix: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    email: string;
    name_suffix: string;
}

export interface ModifiedBy {
    id: string;
    name_prefix: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    email: string;
    name_suffix: string;
}

export interface Managers {
    id: string;
    name_suffix?: string;
    name_prefix?: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
}

export interface Hierarchy {
    id: string;
    name: string;
    hierarchy_level: number;
    hierarchy_order: number;
    is_enabled: boolean;
    foundational_data: FoundationalData[];
    preferred_currency: string;
    managers: Managers[];
    addresses: Address[];
    contact_info: ContactInfo[];
    created_by: CreatedBy;
    created_on: number;
    modified_by: ModifiedBy;
    modified_on: number;
    hierarchies: Hierarchy[];
}
