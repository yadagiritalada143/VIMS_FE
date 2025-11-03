export class Alert {
    id?: string;
    type?: ALERT_TYPE;
    message?: string;
    color?: string;
    bgColor?: string;
    position?: string;
    autoClose?: boolean;

    constructor(init?: Partial<Alert>) {
        Object.assign(this, init);
    }
}

export enum ALERT_TYPE {
    SUCCESS = 'SUCCESS',
    ERROR  = 'ERROR',
    INFO = 'INFO',
    WARNING = 'WARNING',
    INTERVAL_TIME = 3000,
    ERROR_INTERVAL_TIME = 20000
}
