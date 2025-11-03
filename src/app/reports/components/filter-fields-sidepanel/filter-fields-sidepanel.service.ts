import { Injectable } from '@angular/core';
import { ClonerService } from 'src/app/core/services/cloner.service';
import { ISavedReportData } from '../../pages/reports-details/reports-details.interfaces';
import { ReportsDetailsService } from '../../pages/reports-details/reports-details.service';
import {
  ComparisonMode,
  ComparisonTypes,
  IColumnItem,
  IFilterValue,
  IFilterItem,
  FilterViewMode,
  IComparisonOperator,
} from './filter-fields-sidepanel.interfaces';
import { ComparisonOperatorsList } from './filter-fields-sidepanel.models';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';


@Injectable()
export class FilterService {
  public baseReportFilterData: IFilterItem[] = [];
  public baseReportColumnList: IColumnItem[] = [];
  public defaultColumnList : IColumnItem[] = [];

  public defaultReportColumnList :any[] = [];

  public viewMode: FilterViewMode;

  private programDate: string = '';

  private _savedReportData: ISavedReportData = {
    reportName: null,
    reportId: null,
    reportUUID: null,
    columnList: [],
    filterData: {},
  };

  private date_columns = [];

  constructor(
    private _reportsDetailsService: ReportsDetailsService,
    private _cloneService: ClonerService,
    private _datePipe: LocalDateFormatPipe,
    private _storageService: StorageService
  ) {
    this.programDate = this._storageService.get(StorageKeys.CURRENT_PROGRAM)?.defaultDateFormat ?? DATE_FORMAT.FORMATMDY;
  }

  public initData() {
    this.baseReportFilterData = this._cloneService.deepClone(this._reportsDetailsService.reportFilters);
    this.baseReportColumnList = this._reportsDetailsService.getReportDefaultColumnList();

    if (this.viewMode === FilterViewMode.Full) {
      this._savedReportData.columnList = this._reportsDetailsService.reportData.selected_columns.map(column => column.column_name);
      this._savedReportData.filterData = this._reportsDetailsService.reportData.report_filters;
    } else if (this.viewMode === FilterViewMode.Edit || this.viewMode === FilterViewMode.View) {
      this._savedReportData = this._cloneService.deepClone(this._reportsDetailsService.savedReportData);
    }
    this.markColumns();
  }

  public markColumns() {
    for (let i = 0; i < this.baseReportColumnList.length; ++i) {
      const column = this.baseReportColumnList[i];
      let isColumnEnabled = true;
      let isFilterVisible = false;

      if (this._savedReportData.columnList?.length) {
        isColumnEnabled = this._savedReportData.columnList.indexOf(column.name) !== -1 ? true : false;

        const columnValues = this._savedReportData.filterData[column.name];
        column.values = [];
        for (let i = 0; i < columnValues?.length; ++i) {
          column.values.push({ id: columnValues[i], text: columnValues[i] });
        }

        if (this.viewMode === FilterViewMode.View) {
          isFilterVisible = true;
          if (!column.values?.length) {
            isColumnEnabled = false;
          }
        } else {
          if (column.values?.length) {
            isFilterVisible = true;
          }
        }
      }

      //const comparisonType = FieldTypes[column.name];
      const defaultComparisonOperator = ComparisonOperatorsList['string'][0] as IComparisonOperator; //comparisonType ? ComparisonOperatorsList[comparisonType][0] : null;
      this.baseReportColumnList[i] = {
        ...column,
        isEnabled: isColumnEnabled,
        isFilterVisible: isFilterVisible,
        //comparisonType: comparisonType,
        comparisonOperator: defaultComparisonOperator,
        comparisonMode: ComparisonMode.FieldMode,
      };
    }
  }



  // Default Column List changes

  public initDefaultColumnListData() {
    // this.defaultColumnList = this._cloneService.deepClone(this._reportsDetailsService.getReportDefaultColumnList());
    // this.defaultColumnList = this._reportsDetailsService.defaultColumnList;
    this.defaultColumnList = this._reportsDetailsService.loadDefaultColumnList();
    this.markDefaultColumns();
    return this.defaultColumnList;
}

public markDefaultColumns() {
    for (let i = 0; i < this.defaultColumnList.length; ++i) {
        const column = this.defaultColumnList[i];
        let isColumnEnabled = true;
        let isFilterVisible = false;

        if (this._reportsDetailsService.defaultColumnList.table_columns.length) {
            isColumnEnabled = this._reportsDetailsService.defaultColumnList?.table_columns.indexOf(column.name) !== -1 ? true : false;
            const columnValues = this._savedReportData.filterData[column.name];
            column.values = [];
            for (let i = 0; i < columnValues?.length; ++i) {
                column.values.push({ id: columnValues[i], text: columnValues[i] });
            }
            if (this.viewMode === FilterViewMode.View) {
                isFilterVisible = true;
                if (!column.values?.length) {
                    isColumnEnabled = false;
                }
            } else {
                if (column.values?.length) {
                    isFilterVisible = true;
                }
            }
        }

        //const comparisonType = FieldTypes[column.name];
        const defaultComparisonOperator = ComparisonOperatorsList['string'][0] as IComparisonOperator;
        //  comparisonType ? ComparisonOperatorsList[comparisonType][0] : null;
        this.defaultColumnList[i] = {
            ...column,
            isEnabled: true,
            isFilterVisible: isFilterVisible,
            //comparisonType: comparisonType,
            comparisonOperator: defaultComparisonOperator,
            comparisonMode: ComparisonMode.FieldMode,
        };
    }

}

public updateDefaultColumnListFilters(filterData: IFilterItem[]) {
    this._savedReportData.filterData = filterData;
    this.markDefaultColumns();
}





  // End of chanes



  public getComparisonOperatorsByType(type: ComparisonTypes) {
    return ComparisonOperatorsList[type];
  }

  public getFilterDataByColumn(columnName: string) {
    const mappedFilterData = this.baseReportFilterData.map(data => data.filter_id);
    const columnIndex = mappedFilterData.indexOf(columnName);
    if (columnIndex !== -1) {
      return this.baseReportFilterData[columnIndex]?.filter_data;
    } else return [];
  }

  public removeColumnByName(columnName: string) {
    const currentIndex = this._getColumnIndex(columnName);
    if (currentIndex !== -1) {
      this.baseReportColumnList.splice(currentIndex, 1);
    }
  }

  public setColumnInPosition(column: IColumnItem, index: number) {
    const currentIndex = this._getColumnIndex(column.name);
    if (currentIndex !== -1) {
      if (index > currentIndex) {
        index--;
      }
      this.baseReportColumnList.splice(currentIndex, 1);
      this.baseReportColumnList.splice(index, 0, column);
    }
  }

  private _getColumnIndex(columnName: string) {
    const mappedColumns = this.baseReportColumnList.map(column => column.name);
    return mappedColumns.indexOf(columnName);
  }

  public changeFilterValues(values: IFilterValue[], column: IColumnItem) {
    const mappedValues = values.map(value => value.text);
    const currentColumnIndex = this._getColumnIndex(column.name);
    this.baseReportColumnList[currentColumnIndex].values = mappedValues;
  }

  public changeFilterDateValue(date, column: IColumnItem, index) {
    const currentColumnIndex = this._getColumnIndex(column.name);
    if (index == 0 && typeof this.baseReportColumnList[currentColumnIndex].values[1] == 'undefined') {
      this.baseReportColumnList[currentColumnIndex].values[1] = '';
    }

    if (index == 1 && typeof this.baseReportColumnList[currentColumnIndex].values[0] == 'undefined') {
      this.baseReportColumnList[currentColumnIndex].values[0] = '';
    }
    this.baseReportColumnList[currentColumnIndex].values[index] = date;

    // if(index==1 && typeof(this.baseReportColumnList[currentColumnIndex].values[0])!=undefined && this.baseReportColumnList[currentColumnIndex].values[0]!=''){

    //   if(this.baseReportColumnList[currentColumnIndex].values[1] < this.baseReportColumnList[currentColumnIndex].values[0]){

    //     this.baseReportColumnList[currentColumnIndex].values[1] = '';

    //     this._alerts.error('End date should be greater then equal to start date');
    //     return false;
    //   }
    // }
  }

  public deleteFilterValue(column: IColumnItem, value: IFilterValue) {
    const currentColumnIndex = this._getColumnIndex(column.name);
    const filteredColumns = this.baseReportColumnList[currentColumnIndex].values.filter(column => column.text !== value.text);
    this.baseReportColumnList[currentColumnIndex].values = [...filteredColumns];
  }

  public deleteDateFilterValue(column: IColumnItem, value: IFilterValue) {
    const currentColumnIndex = this._getColumnIndex(column.name);

    
    this.baseReportColumnList[currentColumnIndex].values = [];

    // this.baseReportColumnList[currentColumnIndex].values =this.baseReportColumnList[currentColumnIndex].values;
  }

  public getFilterData(filterData?) {
    if (filterData) {
      this.baseReportColumnList = filterData;
    }
    let reportFilters = {};
    this.baseReportColumnList.forEach(column => {
      const isDate = this.isComparisonType(column, 'date');
      // check isFilterVisible is true or false in
      if (column.values?.length && column.isFilterVisible) {
        reportFilters[column.name] = column.values.map((value: any) => {
          if (typeof value === 'string') {
            return isDate ? this._datePipe.transform(value, DATE_FORMAT.FORMATYMD, null, null, true, this.programDate) : value;
          } else if (typeof value === 'object' && value.text) {
            return isDate ? this._datePipe.transform(value.text, DATE_FORMAT.FORMATYMD, null, null, true, this.programDate) : value.text;
          }
        });
      }
    });
    return reportFilters;
  }

  public isComparisonType(column: IColumnItem, type: string) {
    if (!this.date_columns.length) {
      this.date_columns = [
        ...new Set(
          this._reportsDetailsService?.reportColumn?.date_columns?.concat(this._reportsDetailsService?.reportColumn?.datetime_columns),
        ),
      ];
    }
    return !!(type == 'date' && this.date_columns?.includes(column.name));
  }

  public getVisibleColumns() {
    const visibleColumns = this.baseReportColumnList.filter(column => column.isEnabled === true);
    return visibleColumns.map(column => column.name);
  }

  public getDefaultVisibleColumns(ColumnList) {
    let visibleColumns = ColumnList ? ColumnList : [];
    visibleColumns = visibleColumns.filter(column => column.isEnabled === true);
    return visibleColumns.map(column => column.name);
  }

  public getSavedRepotUUID() {
    return this._savedReportData.reportUUID;
  }

  public getSavedReportId() {
    return this._savedReportData.reportId;
  }

  public getSavedReportName() {
    return this._savedReportData.reportName;
  }
}
