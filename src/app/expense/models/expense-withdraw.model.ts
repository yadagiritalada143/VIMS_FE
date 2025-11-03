export interface IWithDrawResponse {
    status: number;
    message: string;
    code: string;
    error: { message: string } | null;
    data: { message: string } | null;
}

export interface IWithDraw {
    withdraw_reason: string;
    withdraw_notes: string;
}