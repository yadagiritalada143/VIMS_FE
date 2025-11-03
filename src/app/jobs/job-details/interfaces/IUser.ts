import { IRole } from './IRole';

export interface IUser {
    id: string,
    name_prefix: string,
    first_name: string,
    middle_name: string,
    last_name: string,
    name_suffix: string,
    email: string,
    username: string,
    title: string,
    external_user_id: string,
    avatar: string,
    role: IRole,
    ent_membr: string,
    is_enabled: boolean,
    invitation_status: string,
    full_name: string
}

export interface IApproverMember {
    total_records: number;
    items_per_page: number
    members: IUser[]
}