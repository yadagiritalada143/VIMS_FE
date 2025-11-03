export interface SideBarData {
    name: string;
    count: number;
    url: string;
    dataUrl: string;
    childComponent?: any;
}

export interface SideBarSection {
    header: string;
    items: SideBarData[];
}