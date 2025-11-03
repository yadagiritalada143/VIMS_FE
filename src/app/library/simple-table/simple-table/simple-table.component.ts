import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { CustomcurrencyPipe } from 'src/app/shared/pipe/customcurrency.pipe';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { ColumnConfig, VMSConfig } from './simple-table.model';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { AccuracyConfigTypes }  from 'src/app/expense/enums/accuracy-config.enum';
@Component({
  selector: 'app-simple-table',
  templateUrl: './simple-table.component.html',
  styleUrls: ['./simple-table.component.scss'],
})
export class SimpleTableComponent implements OnInit, OnDestroy {
  @Input() vmsTableConfig: VMSConfig;
  @Input() vmsDataSource: any[];
  @Input() totalAmount: { amount: number; currency: string } = { amount: 0, currency: '₹' };

  @Output() onCreate = new EventEmitter<boolean>();
  @Output() onViewClick = new EventEmitter();
  @Output() onSort = new EventEmitter();
  @Output() onDeleteClick = new EventEmitter();
  @Output() onEditClick = new EventEmitter();
  @Output() onOpenPanel = new EventEmitter();
  @Output() search = new EventEmitter();

  public columnList = {};
  public isVieworEdit = false;
  public isDelete = false;
  public hoverState;
  public selectedVmsData: any;

  private columnWidth = [];
  private countColumnValue = 0;
  private sortedColumn = '';
  private isSortAsc = true;
  private subscriptions = [];
  public viewCurrencyStrict: string = '0.4-4' ;
  public accuracyConfig = AccuracyConfigTypes;
  constructor(private eventStream: EventStreamService, private datePipe: LocalDateFormatPipe, 
    public currencyPipe: CustomcurrencyPipe,public accuracyPipe: AccuracyPipe
 ) {
  // const currentProgram = this._storageService.get(StorageKeys.CURRENT_PROGRAM);
  // let edit_accuracy = currentProgram?.config?.currency?.edit_accuracy;
  // this.viewCurrencyStrict = edit_accuracy ? `0.${edit_accuracy}-${edit_accuracy}` : this.viewCurrencyStrict;
 }

  ngOnInit(): void {
    if (this.vmsTableConfig && this.vmsTableConfig.columnList) {
      let customColumnlist = this.getCustomColumnList();
          customColumnlist.forEach(element => {
            if(this.vmsTableConfig.columnList.length == 0){
              this.vmsTableConfig.columnList.splice(1, 0, element); 
            }else{
              let count = 0
              this.vmsTableConfig.columnList.forEach((vmsColEement,index) => {
                if(vmsColEement.name == element.name){
                  count++;
                }
                if(index == this.vmsTableConfig.columnList.length-1 && count==0){
                  this.vmsTableConfig.columnList.splice(1, 0, element);;
                }
              });
            }
          });
      this.vmsTableConfig.columnList.forEach((col, index) => {
        this.setDropdownOptions(col);
        col.index = index;
        this.columnList[col.name] = true;
        this.columnList[col.name + '_width'] = col.width;
        if (col.width !== undefined) {
          this.columnWidth.push({ name: col.name, value: col.width });
        } else {
          if (this.vmsTableConfig.isExpand) {
            this.columnWidth.push({ name: col.name, value: (95 / this.vmsTableConfig.columnList.length).toFixed(2) });
          } else {
            this.columnWidth.push({ name: col.name, value: (100 / this.vmsTableConfig.columnList.length).toFixed(2) });
          }
        }
      });
    }

    this.subscriptions.push(
      this.eventStream.on(Events.ITEM_POSITION).subscribe(itemPosition => {
        if (itemPosition) {
          const pageBody = document.getElementById('smarttable');
          const windowHeight = pageBody.offsetHeight;
          const targetItem = document.getElementById('rowDropdown');
          const targetHeight = targetItem.offsetHeight;

          targetItem.style.top = `${itemPosition.top + window.scrollY + 30}px`;
          targetItem.style.left = `${itemPosition.left - 85}px`;
          targetItem.classList.add('active');

          if (itemPosition.top + window.scrollY + 45 + targetHeight > windowHeight) {
            targetItem.classList.add('mirror');
          } else {
            targetItem.classList.remove('mirror');
          }
        }
      }),
    );
  }
  showTooltip(val) {
    return this.accuracyPipe?.transform(val, this.accuracyConfig.AMOUNT, {isEdit : true} );
    // return this.currencyPipe?.transform(val, undefined, undefined, this.viewCurrencyStrict, undefined, true);
  }

  getCustomColumnList(){
    var customColumns = [];
    var staticColCount = this.vmsTableConfig.columnList.length;
    this.vmsDataSource.forEach(element => {
      if(element?.custom_data?.custom_fields?.length >0){
        element?.custom_data?.custom_fields.forEach((FieldElement) => {       
        if(customColumns.length==0){
          customColumns.push(
            {
              index: staticColCount,
              isContact: false,
              isCurrency: false,
              isDescription: true,
              isFIle: false,
              isIcon: false,
              isImage: false,
              isNumberBadge: false,
              name: FieldElement.name,
              title: FieldElement.name
            }
          )
          staticColCount++;
        }else{
          let count = 0;
          customColumns.forEach((colElement,index) => {
            if(colElement.name == FieldElement.name){
              count++;
            }else{
              if(index == customColumns.length-1 && count == 0){
                customColumns.push(
                  {
                    index: staticColCount,
                    isContact: false,
                    isCurrency: false,
                    isDescription: true,
                    isFIle: false,
                    isIcon: false,
                    isImage: false,
                    isNumberBadge: false,
                    name: FieldElement.name,
                    title: FieldElement.name
                  }
                )
                staticColCount++;
              }
            } 
          });
        }
      });
      }
    });
    return customColumns;
  }

  getColumnValue(data: any) {
    if (this.countColumnValue <= this.vmsTableConfig.columnList.length) {
      this.countColumnValue += 1;
      return { data: data[this.vmsTableConfig.columnList[0].name], type: typeof data[this.vmsTableConfig.columnList[0].name] };
    } else {
      this.countColumnValue = 0;
      this.getColumnValue(data);
    }
  }

  setDropdownOptions(name: ColumnConfig) {
    if (name?.isVieworEdit) {
      this.isVieworEdit = true;
    }
    if (name?.isDelete) {
      this.isDelete = true;
    }
  }

  public onCreateClick(event) {
    this.onCreate.emit(event);
  }

  public onSearchClick(event) {
    this.search.emit(event);
  }

  public onViewClickd(_, vmsData) {
    this.onViewClick.emit(vmsData);
  }

  public deleteClick(_, vmsData) {
    this.onDeleteClick.emit(vmsData);
  }

  public onSortClick(name) {
    if (this.sortedColumn === '') {
      this.isSortAsc = true;
    } else if (this.sortedColumn !== name) {
      this.isSortAsc = true;
    } else {
      this.isSortAsc = !this.isSortAsc;
    }
    if (this.sortedColumn === name && this.isSortAsc) {
      this.sortedColumn = '';
    } else {
      this.sortedColumn = name;
    }
    if (this.sortedColumn === name && this.isSortAsc) {
      this.onSort.emit({ name, order: 'ASC' });
    } else if (this.sortedColumn === name && !this.isSortAsc) {
      this.onSort.emit({ name, order: 'DESC' });
    } else if (this.sortedColumn === '') {
      this.onSort.emit(undefined);
    }
  }

  public editClicked(_, vmsData) {
    this.onEditClick.emit(vmsData);
  }

  public clickToViewPanel(event, vmsData?) {
    if (vmsData) {
      this.onOpenPanel.emit(vmsData);
    } else {
      this.onOpenPanel.emit(event);
    }
  }

  public scrollLeft(event) {
    if (event) {
      const shadowTarget = document.querySelector('.listing-wrap');
      shadowTarget.classList.remove('reach-end');
    }
  }

  public scrollRight(event) {
    if (event) {
      const shadowTarget = document.querySelector('.listing-wrap');
      shadowTarget.classList.add('reach-end');
    }
  }

  public hideOptionDropdown() {
    this.eventStream.emit(new EmitEvent(Events.OPTION_DROPDOWN, true));
    this.hoverState = null;
  }

  public hoverClass(i, vmsData) {
    this.selectedVmsData = vmsData;
    this.hoverState = i;
  }

  private getFormattedDate(date) {
    if (date) {
      return this.datePipe.transform(date);
    }
  }

  public getColumnData(name: any, column: any, data: any) {
    if (typeof name === 'object') {
      if (data[name[0]] !== 'None' && data[name[1]] !== 'None') {
        return this.getFormattedDate(data[name[0]]) + ' - ' + this.getFormattedDate(data[name[1]]);
      } else {
        return null;
      }
    }

    const nameList = name?.split('.');
    if (column?.isArray) {
      let returnData = [];
      let tempData;
      if (!data[nameList[0]]) {
        return null;
      }
      for (let nl of nameList) {
        if (tempData) {
          if (!tempData[nl]) {
            break;
          }
          tempData = tempData[nl];
        } else {
          tempData = data[nl];
        }
      }
      if (tempData) {
        tempData?.forEach(td => {
          if (td[nameList[nameList?.length - 1]]) {
            returnData.push(td[nameList[nameList?.length - 1]]);
          }
        });
      }
      return returnData;
    } else {
      if (nameList?.length > 1) {
        let returnData;
        if (!data[nameList[0]]) {
          return null;
        }
        nameList?.forEach(n => {
          if (returnData) {
            returnData = returnData[n];
          } else {
            returnData = data[n];
          }
        });
        return returnData;
      }
    }

    if(data?.custom_data?.custom_fields && data?.custom_data?.custom_fields?.length > 0){
      var customValue = '';
      data.custom_data.custom_fields.forEach(element => {
        if(element.name == name){
          customValue = element.value;
        }
      });
      if(customValue != ''){
        if(customValue == null || customValue == 'null'){
         customValue = '--';
        }  
        return customValue;
      }else{
        return data[name];
      }
    }else{
      return data[name];
    }
  }

  public hideDropdownBox() {
    const targetItem = document.getElementById('rowDropdown');
    targetItem.classList.remove('active');
    targetItem.classList.remove('flip');
    targetItem.style.top = '';
    targetItem.style.left = '';
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
