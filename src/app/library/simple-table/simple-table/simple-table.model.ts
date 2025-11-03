export interface VMSConfig {
    columnList: ColumnConfig[];
    title: string;
    isExpand?: boolean;
    isFilter?: boolean;
    isSearch?: boolean;
    isSetting?: boolean;
    isTopPagination?: boolean;
    isCreate?: boolean;
    isCreateButtonName?: string;
    density?: string;
    permission?: string;
    hasLongText?: boolean;
    showTabs?: boolean;
    isSort?: boolean;
}

export interface ColumnConfig {
    name: string;
    index?: number;
    title?: string;
    isIcon?: boolean;
    isImage?: boolean;
    isContact?: boolean;
    isNumberBadge?: boolean;
    isNoOption?: boolean;
    isVieworEdit?: boolean;
    isDelete?: boolean;
    isCurrency?: boolean;
    width?: number;
    isFIle?: boolean;
    isDescription?: boolean;
}
