import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DndDropEvent } from 'ngx-drag-drop';
import { IColoumnDefinition, IColoumnSettingConfig } from '../svms-table.model';
import * as _ from 'lodash';

@Component({
  selector: 'app-svms-column-setting',
  templateUrl: './svms-column-setting.component.html',
  styleUrls: ['./svms-column-setting.component.scss'],
})
export class SvmsColumnSettingComponent implements OnInit {
  private _visibility: boolean;
  deselectAll: boolean = false;

  @Input() set visibility(value: boolean) {
    this._visibility = value;
    if (this._visibility) {
      this.tempSelectedColumns = _.cloneDeep(this.selectedColumns);
      if (this.coloumnSettingConfig && this.coloumnSettingConfig.availableColumns) {
        this.coloumnSettingConfig.availableColumns().subscribe(response => {
          this.availableColumns = response;
          if (this.availableColumns?.length > 0 && this.selectedColumns?.length > 0) {
            this.availableColumns.map(col => {
              let selectedCol = this.selectedColumns.find(selCol => selCol.id == col.id);
              if (!selectedCol) {
                col.hidden = true;
              }
            });
          }
        });
      }
    }
  }

  get visibility() {
    return this._visibility;
  }
  @Input() coloumnSettingConfig: IColoumnSettingConfig;
  @Input() selectedColumns: Array<IColoumnDefinition>;
  availableColumns: Array<IColoumnDefinition>;
  tempSelectedColumns: Array<IColoumnDefinition>;
  dragStartIndex: number;
  @Output() onApplySetting = new EventEmitter<Array<IColoumnDefinition>>();
  @Output() onClose = new EventEmitter<any>();

  constructor() {}

  ngOnInit(): void {
    this.createDeepCopy();
    this.tempSelectedColumns = _.cloneDeep(this.selectedColumns);
  }

  onToggleSelectAll = () => {
    this.availableColumns.forEach((availCol: IColoumnDefinition, index: number) => {
      if (index > 0) {
        let coloumnExists = this.tempSelectedColumns.find(col => col.field === availCol.field);
        if (!coloumnExists && !this.deselectAll) {
          availCol.hidden = false;
          this.tempSelectedColumns.push(availCol);
        } else if (coloumnExists && this.deselectAll) {
          availCol.hidden = true;
          _.remove(this.tempSelectedColumns, columns => {
            if (columns.field == availCol.field) return true;
          });
        }
      }
    });
    this.sortColumns();
    this.tempSelectedColumns = [...this.tempSelectedColumns];
  };

  createDeepCopy = () => {
    if (!this.coloumnSettingConfig?.availableColumns) {
      this.availableColumns = _.cloneDeep(this.selectedColumns);
    }
  };

  onDrop(event: DndDropEvent) {
    if (event.data && typeof event.index !== undefined) {
      if (this.dragStartIndex >= 0) {
        this.swapArrayLocations(this.tempSelectedColumns, event.data, event.index);
        this.sortColumns();
        this.tempSelectedColumns = [...this.tempSelectedColumns];
      }
    }
    this.dragStartIndex = null;
  }

  swapArrayLocations = (arr, index1, index2) => {
    if (index2 == 0) return
    arr.splice(index2,0,arr[index1])
    if(index1 > index2){
    arr.splice(index1 + 1,1)
    }else{
    arr.splice(index1,1)
    }
    // let temp = arr[index1];
    // arr[index1] = arr[index2];
    // arr[index2] = temp;
  };

  onDragStart(index: number) {
    this.dragStartIndex = index;
  }

  onClickColumn = (col: any) => {};

  onApplyChange = () => {
    this.visibility = false;
    if (this.availableColumns.length > 0) {
      this.availableColumns.forEach(col => {
        let column = this.tempSelectedColumns.find(colDef => colDef.field == col.field);
        if (column) {
          column.hidden = col.hidden;
          column.order = col.order;
        }
      });
      this.selectedColumns = _.cloneDeep(this.tempSelectedColumns);
    }
    this.onApplySetting.emit(this.selectedColumns);
    this.onCloseModal(true);
  };

  sortColumns = () => {
    let order = 0;
    this.tempSelectedColumns?.map(col => {
      col.order = order++;
    });
  };

  onCloseModal = (value: any) => {
    this.onClose.emit(false);
  };

  onToggleColumn = (column: IColoumnDefinition) => {
    column.hidden = !column.hidden;
    let coloumnExists = this.tempSelectedColumns.find(col => col.field === column.field);
    if (!coloumnExists) {
      this.tempSelectedColumns = [...this.tempSelectedColumns, column];
    } else if (coloumnExists) {
      _.remove(this.tempSelectedColumns, columns => {
        if (columns.field == column.field) return true;
      });
      this.tempSelectedColumns = [...this.tempSelectedColumns];
    }
    this.sortColumns();
  };
}
