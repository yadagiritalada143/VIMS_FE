export interface WorkerModel {
    account_created: number;
    candidate: {
        id: string,
        name: string,
        email: string,
        initials: string,
        phone: any,
    },
    user: {
        id: string;
        name: string;
        email: string;
        initials: string;
        phone: any;
        username: string;
        role: {
            id: string;
            name: string;
            organization_category: string;
        };
        worker_id: string;
    }
}