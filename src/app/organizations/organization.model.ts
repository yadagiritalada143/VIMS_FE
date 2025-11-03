export type Categories = "MSP" | "VENDOR" | "CLIENT"

export interface Filters {
    categories?: Categories[],
    labor_categories?: string[],
    name?: string,
    date_range?: [number, number],
    is_enabled?: boolean
}

export type Order = "ASC" | "DESC"

export interface SortOrder {
    field?: string,
    order?: Order
}

export interface OrgFilter {
    filters?: Filters,
    sort_order?: SortOrder[],
    pagination?: {
        limit?: number,
        page?: number
    }
}
