export interface ICalendarEvent {
    title: string;
    color: string;
    infoType?: string;
    eventType?: string;
    link?: string;
    date?: Date;
    startDate?: Date;
    endDate?: Date;
}

export interface IClickPosition {
    x: number;
    y: number;
}

export enum CalendarViewTypes {
    Holiday = 'holiday',
    WorkEvent = 'work_event'
}

export enum CalendarType {
    Month = 'month',
    Week = 'week',
    Day = 'day',
    Today = 'today',
    List = 'list'
}
