import { Widgets } from "../widget.types";
import { CalendarViewTypes } from '../../full-calendar/full-calendar.interfaces'

export interface ICalendarInterviewsResponse {
    color: string;
    contractID: string;
    end: string;
    info_type: string;
    link: string;
    start: string;
    title: string;
    type: string;
}

export interface ICalendarLeavesResponse {
    assignment_code: string;
    color: string;
    holiday_date: string;
    holiday_id: string;
    holiday_name: string;
    link: string;
}

export const ViewTypeForCalendar = {
    [Widgets.CalendarInterviewsAndOffers]: CalendarViewTypes.WorkEvent,
    [Widgets.CalendarItems]: CalendarViewTypes.WorkEvent,
    [Widgets.CalendarLeaves]: CalendarViewTypes.Holiday
}

