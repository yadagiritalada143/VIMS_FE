export interface VMSTreeConfig{
    columnList: TreeColumnConfig[];
    title: string;
    isSetting?: boolean;
    isFilter?: boolean;
    isTopPagination?: boolean;
    submenuName?: string;
    isSearch?: boolean;
}


export interface TreeColumnConfig{
    index?: number;
    name: string;
    title?: string;
    width?: number;
    isIcon: boolean;
    icon?: string;
    iconClass?: string;
    isImage: boolean;
    isContact?: boolean;
    isNoOption?: boolean;
    // LEGACY: Rate Factor support
    isVieworEdit?: boolean;
    isDisableorDelete?: boolean;
    // NEW: [NOTE: `isCreate` also used for adding sub-level]
    isCreate?: boolean;
    isView?: boolean;
    isEdit?: boolean;
    isDisable?: boolean;
    isDelete?: boolean;
    isStatusColor?:boolean;
    isIconList?:boolean;
    isMultiUser?:boolean;
    isVisible?:boolean;
}
