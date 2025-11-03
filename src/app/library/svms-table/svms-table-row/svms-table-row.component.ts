import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { ColumnType, IColoumnDefinition, ITableOptions } from '../svms-table.model';
import * as _ from 'lodash';
import { StorageService,StorageKeys } from 'src/app/core/services/storage.service';
import { DATE_FORMAT } from '../../date-format/date-format.model';

@Component({
  selector: '[app-svms-table-row]',
  templateUrl: './svms-table-row.component.html',
  styleUrls: ['./svms-table-row.component.scss'],
})
export class SvmsTableRowComponent {
  _rowData: any;
  @Input() coloumnDefintions: Array<IColoumnDefinition>;
  @Input() tableOptions: ITableOptions;
  @Input() set rowData(value: any) {
    this._rowData = value;
  }

  @Input() totalRows:number;
  @Input() rowIndex: number;
  get rowData() {
    return this._rowData;
  }

  @ViewChild('firstColumn', { read: ElementRef, static: false }) firstColumn: ElementRef;
  @ViewChild('secondColumn', { read: ElementRef, static: false }) secondColumn: ElementRef;
  @ViewChild('dateColumn', { read: ElementRef, static: false }) dateColumn: ElementRef;
  @ViewChild('dateTimeColumn', { read: ElementRef, static: false }) dateTimeColumn: ElementRef;
  tooltiptext: string = '';
  tooltipTextSecond: string = '';
  tooltipTextDate: string = '';
  tooltipTextDateTime: string = '';
  dateFormat: string;

  constructor(private storeService: StorageService) {
    this.dateFormat = this.storeService.get(StorageKeys.CURRENT_PROGRAM)?.defaultDateFormat ?? DATE_FORMAT.FORMATMDY;
  }


  get dropDownPosition(){
    if(this.totalRows < 4){
      return 'bottom';
    }
    return this.rowIndex < Math.floor(this.totalRows / 2)  ? 'bottom' : 'top' ;
   }

  get ColumnType() {
    return ColumnType;
  }

  getColumnValue = (fieldName: string, placeholder: string = null,columnType:number = null) => {
    let data: any = null;
    if (fieldName && this.rowData) {
      data = _.get(this.rowData, fieldName);
    }



    if((data === null) || (data === undefined) || (data === '')) {
      return placeholder ?? '--';
    }

    if(columnType === ColumnType.DATE) {
      if(typeof(data) === 'string') {
        data = data?.split(' ')?.[0]?.split('T')?.[0];
      }
    }

    return data;
  };

  onClick = (column: IColoumnDefinition) => {
    if (column && column.onClick) {
      column.onClick(this.rowData);
    }
  }

   calculateFieldWidth(fieldWidth) {
    const columnWidth = fieldWidth.nativeElement?.offsetWidth || 0;
    const columnDataLength = fieldWidth.nativeElement?.children?.[0]?.offsetWidth || 0;
    const columnDataValue = fieldWidth.nativeElement?.children?.[0]?.getAttribute?.("data-value") || '';
    if(columnDataLength > columnWidth) {
       return columnDataValue;
    }
    else {
      return '';
    }
  }

  getField() {
  this.tooltiptext = this.calculateFieldWidth(this.firstColumn)
  }

  getFieldSecond() {
   this.tooltipTextSecond = this.calculateFieldWidth(this.secondColumn)
  }

  getFieldDate() {
   this.tooltipTextDate = this.calculateFieldWidth(this.dateColumn)
  }

  getFieldDateTime() {
   this.tooltipTextDateTime = this.calculateFieldWidth(this.dateTimeColumn)
  }
}
