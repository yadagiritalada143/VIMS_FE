import { Component, OnInit, ViewChildren } from '@angular/core';
import { DynamicHtmlTemplateBuilderService } from '../../dynamic-html-template-builder.service';
import { Col, RowObject } from '../../dynamic-html-template-builder.model';
import { ColRendererComponent } from '../col-renderer/col-renderer.component';
import { RowRendererComponent } from '../row-renderer/row-renderer.component';

@Component({
  selector: 'app-design-panel',
  templateUrl: './design-panel.component.html',
  styleUrls: ['./design-panel.component.scss']
})
export class DesignPanelComponent implements OnInit {

  currentConfig: RowObject = { rows: [] };
  blankColumn: Col = {
    items: [],
    width: '',
  };
  selectedRowIndex = -1;

  @ViewChildren(RowRendererComponent) allRows;
  @ViewChildren(ColRendererComponent) allCells;

  constructor(private dynamicHtmlTemplateBuilderService: DynamicHtmlTemplateBuilderService,) {
      console.log("Hi");
  }

  ngOnInit(): void {
    // this.currentConfig = this.dynamicHtmlTemplateBuilderService.config;
    this.dynamicHtmlTemplateBuilderService.configLoaded.subscribe((config:any) => this.currentConfig = config);
    this.dynamicHtmlTemplateBuilderService.configUpdated.subscribe((config:any) => this.currentConfig = config);
    this.dynamicHtmlTemplateBuilderService.itemSelected.subscribe(() => {
      // this.allRows && this.allRows.forEach(row => {
      //   row.allCells && row.allCells.forEach((cell) => cell.applyStyles());
      // });

      this.allCells && this.allCells.forEach((cell) => cell.applyStyles());
    });
  }

  onClickItemDelete(event) {
    // this.currentConfig?.rows[event.rowIndex]?.cols[event?.colIndex]?.items.splice(event?.itemIndex, 1 );
    this.dynamicHtmlTemplateBuilderService.deleteItem(event);
  }

  onClickCellDelete(event) {
    this.currentConfig?.rows[event.rowIndex]?.cols.splice(event?.colIndex, 1);
    if (this.currentConfig?.rows[event.rowIndex]?.cols?.length === 0) {
      this.onClickRowDelete(event?.rowIndex);
    }
  }

  onClickRowDelete(rowIndex) {
    // this.currentConfig?.rows.splice(rowIndex, 1);
    this.dynamicHtmlTemplateBuilderService.deleteRow(rowIndex);
  }

  onCellClick(event) {
    if (event && event.hasOwnProperty('rowIndex') && event.rowIndex > -1) {
      this.selectedRowIndex = event?.rowIndex;
    }
  }

  copyData() {
    // let clonedData = {rows: []};

    if(!this.currentConfig) {
      return;
    }

    if(!this.currentConfig.rows) {
      return;
    }
    let clonedData:any = {...this.currentConfig};

    clonedData.rows = clonedData.rows.map(row => {
      row.cols = row.cols && row.cols.map(col => {
        col.items = col.items && col.items.map(item => {
          // item = {...item};
          // delete item.componentRef;
          // return item;
          const newItem = {};
          for (const key in item) {
            if (key !== 'componentRef') {
              newItem[key] = item[key]
            }
          }
          return newItem;
        })
        // col = {...col};
        const newCol = {};
        for (const key in col) {
          if (key !== 'componentRef') {
            newCol[key] = col[key]
          }
        }
        return newCol;
      })
      // delete row.componentRef
      // return row;
      const newRow = {};
      for (const key in row) {
        if (key !== 'componentRef') {
          newRow[key] = row[key]

        }
      }

      return newRow;
    })

    console.log(clonedData);
  }

}
