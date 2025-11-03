export class Log {
    type?: LOG_TYPE;
    heading?: string;
    messages?: any[];
    autoClose?: boolean;
    isShown?:boolean;
    isCollapsed?:boolean=false;
    showReportButton?: boolean;
    hideType?: hideType = hideType.Close;
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

export enum hideType {
  Close,
  Collapse,
}
