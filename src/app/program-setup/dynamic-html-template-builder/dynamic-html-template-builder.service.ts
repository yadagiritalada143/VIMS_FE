import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DynamicHtmlTemplateBuilderService {

  config: any;
  itemAdded: Subject<any> = new Subject<any>();
  itemSelected: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  rowAdded: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  configLoaded: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  configUpdated:Subject<any> = new Subject<any>();
  selectedItem: BehaviorSubject<any> = new BehaviorSubject<any>(null);


  selectedRow: any;
  selecteCol: any;
  selectedRowIndex: any;
  selectedColIndex: any;

  get itemSelected$() {
    return this.itemSelected.asObservable();
  }

  setSelectedItemValue(item: any) {
    this.selectedItem.next(item);
  }

  setConfig(config) {
    this.config = config;
    this.configLoaded.next(this.config);
  }

  setSelectedCell(rowIndex, colIndex) {
    this.selectedRowIndex = rowIndex;
    this.selectedColIndex = colIndex;
    this.selectedRow = this.config.rows[rowIndex];
    this.selecteCol = this.selectedRow.cols[colIndex];
    this.itemSelected.next({});
  }

  addItem(item: any) {
    this.itemAdded.next(item);
  }

  setSelectedItem(item: any) {
    this.itemSelected.next({})
  }

  deleteRow(index: number) {
    this.config.rows[index] = null;
    this.config?.rows.splice(index, 1);
    this.configLoaded.next(this.config);
  }

  deleteItem(event: any) {
    this.config?.rows[event.rowIndex]?.cols[event?.colIndex]?.items.splice(event?.itemIndex, 1);
    this.configLoaded.next(this.config);
  }

  reArrangeRows(rowIndex1: number, rowIndex2: number) {

  }

  mergeCols(rowIndex: number, colIndex: number) {

  }

  addRow(item: any) {
    const newRow = {
      cols: [],
      styles: [{ key: '', value: '' }],
      attributes: [{ key: '', value: '' }]
    };

    for (let colIndex = 0; colIndex < item.noOfCols; colIndex++) {
      newRow.cols.push({ styles: [{ key: '', value: '' }], attributes: [{ key: '', value: '' }] });
    }
    if (!this.config) {
      this.config = {
        rows: []
      };
    }
    this.config.rows.push(newRow);
    this.configUpdated.next(this.config);
  }

  constructor() {
  }

  getClonedObjectExclidingProperties(object, propstoExclude) {
    const newItem = {};
    for (const key in object) {
      if (propstoExclude.indexOf(key) === -1) {
        newItem[key] = object[key]
      }
    }
    return newItem;
  }
  removeAllComponetRefProps(currentConfig: any) {
    if (!currentConfig) {
      return;
    }

    if (!currentConfig.rows) {
      return;
    }
    let clonedData: any = { ...currentConfig };

    clonedData.rows = clonedData.rows.map(row => {
      row.cols = row.cols && row.cols.map(col => {
        col.items = col.items && col.items.map(item => {
          return this.getClonedObjectExclidingProperties(item, ['componentRef']);
        })
        return this.getClonedObjectExclidingProperties(col, ['componentRef']);
      })
      return this.getClonedObjectExclidingProperties(row, ['componentRef']);
    })
    return clonedData
  }
}
