import { GridsterItem, GridsterItemComponent } from 'angular-gridster2';
import { ICalendarWidget, ICustomWidget, IListWidget, IQuickLinkWidget } from '../library/widget/widget.interfaces';
import { ChartTypes, WidgetCategories, Widgets } from '../library/widget/widget.types';

export interface IWidgetData {}

export interface IWidgetDataItem {
    name: Widgets;
    label: string;
    chartType?: ChartTypes;
    dimension?: string;
    options?: string [];
}


export interface IWidgetGridItem {
    x: number;        // x position if missing will auto position
    y: number;        // y position if missing will auto position
    rows: number;     // number of rows if missing will use grid option defaultItemRows
    cols: number;
    name?: Widgets;
    minItemRows?: number;
    maxItemRows?: number;
    minItemCols?: number;
    maxItemCols?: number;
    minItemArea?: number;
    maxItemArea?: number;
    dragEnabled?: boolean;
    resizeEnabled?: boolean;
    compactEnabled?: boolean;
    deleted?: boolean;
    hidden?: boolean;
    initCallback?: (item: GridsterItem, itemComponent: GridsterItemComponent) => void;
}


export interface IVendorDefaultDashboard {
    [Widgets.QuickContactSupport]: IQuickLinkWidget;
    [Widgets.ListPendingActions]: IListWidget;
    [Widgets.CalendarInterviewsAndOffers]: ICalendarWidget;
}

export interface IClientDefaultDashboard {
    [Widgets.QuickAddJob]: IQuickLinkWidget;
    [Widgets.QuickHeadCount]: IQuickLinkWidget;
    [Widgets.QuickContactSupport]: IQuickLinkWidget;
    [Widgets.QuickCurrentOpenings]: IQuickLinkWidget;
    [Widgets.ListPendingActions]: IListWidget;
    [Widgets.ListSOWPendingActions]: IListWidget;
    [Widgets.CalendarInterviewsAndOffers]: ICalendarWidget;
    [Widgets.QuickAddSOW]: IQuickLinkWidget;
}

export interface IWorkerDefaultDashboard {
    [Widgets.CustomCardMyProfile]: ICustomWidget;
    [Widgets.QuickCreateTimesheet]: IQuickLinkWidget;
    [Widgets.QuickViewAllTimesheets]: IQuickLinkWidget;
    [Widgets.ListTimesheets]: IListWidget;
    [Widgets.CalendarLeaves]: ICalendarWidget;
}

export interface IDefaultGridItemSizes {
    [WidgetCategories.Calendars]: IWidgetGridItem;
    [WidgetCategories.Charts]: IWidgetGridItem;
    [WidgetCategories.Lists]: IWidgetGridItem;
    [WidgetCategories.QuickLink]: IWidgetGridItem;
}

export interface IEditModeData {
    onlyForWidgets?: boolean;
    editMode: boolean;
}

export interface IWidgetUpdateData {
    name: Widgets;
    deleted?: boolean;
    label?: string;
    chartType?: ChartTypes;
    dimension?: string;
    options?: string [];
}

export interface IWidgetsConfig {
    [WidgetCategories.Calendars]: any;
    [WidgetCategories.Charts]: any;
    [WidgetCategories.Lists]: any;
    [WidgetCategories.QuickLink]: any;
}

export interface IChartDimensions {
    label: string;
    dimension: string;
}

export interface IChartType {
    label: string;
    icon: string;
    type: ChartTypes;
}

export interface IListOptions {
    label: string;
    option: string;
}
