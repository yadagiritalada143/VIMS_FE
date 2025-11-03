import { widgetIcons } from '../widget-icons.config';
import { ICalendarWidget } from '../widget.interfaces';
import { WidgetCategories, Widgets, WidgetSizes } from '../widget.types';


// --- MOCKUP WIDGETS --- //

const calendarInterviewsAndOffers: ICalendarWidget = {
    label: 'Interviews & Offers',
    category: WidgetCategories.Calendars,
    name: Widgets.CalendarInterviewsAndOffers,
    api: '/report/programs/<PROGRAM_ID>/interviews',
    link: '/',
    ...widgetIcons[Widgets.CalendarInterviewsAndOffers],
    isActive: false,
    isExpandable: true,
    height: 13,
    width: 12,
    minHeight: 10,
    maxHeight: 20,
    minWidth: 5,
    maxWidth: 16,
    filters: [],
    size: WidgetSizes.Large,
    userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
    formData: {
        label: {
            placholder: 'Enter Label'
        }
    }
};

///////////////////////////

const calendarLeavesConfig: ICalendarWidget = {
    label: 'Leaves Calendar',
    category: WidgetCategories.Calendars,
    name: Widgets.CalendarLeaves,
    api: '/report/programs/<PROGRAM_ID>/leaves-calendar/<WORKER_ID>?assignment_id=<ASSIGNMENT_ID>',
    link: '/',
    ...widgetIcons[Widgets.CalendarLeaves],
    isActive: false,
    isExpandable: true,
    height: 13,
    width: 12,
    minHeight: 10,
    maxHeight: 20,
    minWidth: 5,
    maxWidth: 16,
    filters: [],
    size: WidgetSizes.Large,
    userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
    formData: {
        label: {
            placholder: 'Enter Label'
        }
    }
};

export const calendarWidgetsConfig = {
    [Widgets.CalendarInterviewsAndOffers]: calendarInterviewsAndOffers,
    [Widgets.CalendarLeaves]: calendarLeavesConfig
};
