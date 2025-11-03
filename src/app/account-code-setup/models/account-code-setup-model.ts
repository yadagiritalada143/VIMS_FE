export class AccoutCodeValidationRequest {
    params: AccountCodeValidationParams;
    payload: AccountCodeValidationPayload;
}

export class AccountCodeValidationParams {
    worker_id: string;
    module_name: string;
    action: string;
    unit_id: string;
}
export class AccountCodeValidationPayload {
    [key: string]: string
}