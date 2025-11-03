export interface IExpenseResponse<T> {
    status: number;
    data: T | null;
    code: string;
    error: { message: string } | null;
    message: string;
}

export interface IExpenseAssignmentData {
    assignment_manager: object;
    assignment_title: {
        id: string;
        name: string;
    };
    assignment_uuid: string;
    code: string;
    created_at: string;
    end_date: string;
    finance: object;
    hierarchy: {
        id: string;
        name: string;
    };
    initial: any;
    start_date: string;
    status: string;
    timezone: string;
    updated_at: string;
    work_location: object;
    worker: object;
}
