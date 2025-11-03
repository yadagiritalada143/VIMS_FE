export interface Filters {
    service_type?: string[];
    clients?: string[];
    msps?: string[];
    vendors?: string[];
    name?: string;
    unique_id?: string;
    is_enabled?: boolean;
    start_date?: number[];
}

export interface SortOrder {
    field: string;
    order: string;
}

export interface Pagination {
    limit: number;
    page: number;
}

export interface ProgramsFilterModel {
    filters?: Filters;
    sort_order?: SortOrder[];
    pagination: Pagination;
}

export interface TaskModel {
    name: string;
    task_type: string;
    description?: string;
    is_enabled?: boolean;
    role_id?: any;
    config: any
}