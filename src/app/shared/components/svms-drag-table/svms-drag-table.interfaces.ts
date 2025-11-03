interface DragTableConfig {
    showDraggable: boolean;
    showIcons: boolean;
    showLastDraggable?: boolean;
    columns: Array<DragTableColumn>;
}

interface DragTableColumn {
    showHeader: boolean;
    headerName: string;
    headerKey: string;
    width: number;
    type: 'READONLY' | 'NUMBER' | 'NUMBER-RANGE' | 'SELECT' | 'DATEPICKER';
}

interface IconEntry {
    name: string;
    size?: string;
    color?: string;
    type?: string;
    theme?: string;
    class?: string;
    cuClass?: string;
}

export { DragTableConfig, DragTableColumn, IconEntry };
