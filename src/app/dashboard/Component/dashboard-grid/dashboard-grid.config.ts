import { CompactType, DisplayGrid, GridsterConfig, GridType } from 'angular-gridster2';

export let GridConfig: GridsterConfig = {
  gridType: GridType.VerticalFixed,
  maxCols: 18,
  minCols: 18,
  fixedColWidth: 50,
  fixedRowHeight: 50,
  displayGrid: DisplayGrid.None,
  compactType: CompactType.None,
  pushItems: true,
  margin: 20,
  outerMarginTop: 5,
  draggable: {
    enabled: true
  },
  resizable: {
    enabled: true
  }
};
