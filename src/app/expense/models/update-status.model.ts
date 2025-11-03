export interface EntityStatus {
    action_by_admin: boolean;
    approval_notes: string;
    approval_reason: string;
    created_on: string;
    entity_id: string;
    entity_name: string;
    final_status: string;
    id: string;
    levels: any;
    modified_by: string;
    program_id: string;
    get_obj: String;
}

export interface ApprovalPayload {
    status_note: string;
    status_reason: string;
    status: string;
}