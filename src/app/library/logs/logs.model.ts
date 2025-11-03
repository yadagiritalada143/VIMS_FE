export class Log {
    type?: LOG_TYPE;
    heading?: string;
    messages?: any[];
    autoClose?: boolean;
    isShown?:boolean;
    showReportButton?: boolean;
    hideClose?: boolean = false;
    additionalInfo?: any;

    constructor(init?: Partial<Log>) {
        Object.assign(this, init);
    }
}

export enum LOG_TYPE {
    SUCCESS = 'SUCCESS',
    ERROR  = 'ERROR',
    INFO = 'INFO',
    WARNING = 'WARNING'
}
