    export interface Filters {
        name?: string;
        date_range?: number[];
        is_enabled?: boolean;
    }

    export interface Pagination {
        limit: number;
        page: number;
    }

    export interface QualificationFilterModel {
        filters?: Filters;
        pagination?: Pagination;
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
    
    export interface QualificationType {
        id: string;
        created_by: CreatedBy;
        modified_by: ModifiedBy;
        created_on: any;
        modified_on: any;
        type: string;
        name: string;
        code: string;
        description: string;
        is_enabled: boolean;
        hierarchy_levels: any[];
        total_qualifications: number;
    }
    
    export interface QualificationTypeList {
        total_records: number;
        items_per_page: number;
        qualification_types: QualificationType[];
    }
    
    export interface Qualification {
        id: string;
        created_by: CreatedBy;
        modified_by: ModifiedBy;
        created_on: any;
        modified_on: any;
        hierarchy_units: string[];
        source: string;
        name: string;
        code: string;
        description: string;
        is_enabled: boolean;
    }
    
    export interface QualificationList {
        total_records: number;
        items_per_page: number;
        qualifications: Qualification[];
    }
    
    