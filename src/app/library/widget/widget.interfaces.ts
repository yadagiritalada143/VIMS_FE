import { ChartTypes, IconNames, WidgetCategories, Widgets, WidgetSizes } from './widget.types';

export interface IWidget {
    category: WidgetCategories;
    name: Widgets;
    label: string;
    link: string;
    icon: string;
    iconColor: string;
    isExpandable: boolean;
    isActive: boolean;
    height: number;
    width: number;
    filters: any[];
    size: WidgetSizes;
    userType: string[];
    formData: any;
    changed?: boolean;
    items?: string[];
}

export interface IQuickLinkWidget extends IWidget {
    api: string;
}

export interface IListWidget extends IWidget {
    apis: any[];
    options?: string[];
    is_sow_url?: boolean;
    loaded?: boolean;
}

export interface IChartWidget extends IWidget {
    api: string;
    chartType?: ChartTypes;
    defaultChartType?: ChartTypes;
    dimension?: string;
    report_id?: string;
    minHeight: number;
    maxHeight: number;
    minWidth: number;
    maxWidth: number;
}

export interface ICalendarWidget extends IWidget {
    api: string;
    minHeight: number;
    maxHeight: number;
    minWidth: number;
    maxWidth: number;
}

export interface ICustomWidget extends IWidget {
    api: string;
    minHeight: number;
    maxHeight: number;
    minWidth: number;
    maxWidth: number;
}

export interface ITableWidget extends IWidget {
    api: string;
    minHeight: number;
    maxHeight: number;
    minWidth: number;
    maxWidth: number;
}

export interface IWidgetIcon {
    icon: IconNames;
    iconColor: string;
}
