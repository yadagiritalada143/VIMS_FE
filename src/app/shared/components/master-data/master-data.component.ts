import { Component, OnInit, Input } from '@angular/core';
import { TimesheetService } from 'src/app/wipro-timesheet/timesheet.service';
import { ExpenseService } from  'src/app/expense/expense.service';
@Component({
  selector: 'app-master-data',
  templateUrl: './master-data.component.html',
  styleUrls: ['./master-data.component.scss']
})
export class MasterDataComponent implements OnInit {
  // @Input() masterData: boolean;
  // @Input() currentTimesheetData: any;
  _currentTimesheetData: any;
  @Input()
  set currentTimesheetData(value: any) {
    this._currentTimesheetData = value;
  }
  status: boolean = true;
  toggleMenu = [];
  isMdtAllow: boolean = false;
  masterData: any;
  @Input() isExpenseConfig:boolean = false;
  constructor(
    private timesheetService: TimesheetService,
    private expenseService: ExpenseService
    ) { }

  ngOnInit(): void {
    // if(this.isExpenseConfig){
    //   this.getExpenseMasterData();
    // }else{
    //   this.getTimesheetMasterData();
    // }
  }

  ngOnChanges() {
    if (this.isExpenseConfig) {
      this.getExpenseMasterData();
    } else {
      this.getTimesheetMasterData();
    }
  }
  
  getExpenseMasterData() {
    this.expenseService.getExpenseMasterData(this._currentTimesheetData).subscribe(
      (data: any) => {
        this.isMdtAllow = data?.data?.expense_config?.header?.is_allow;
        if(this.isMdtAllow){
          this.getExpenseMasterDataValues();
        }
      });
  } 

  getExpenseMasterDataValues() {
    this.expenseService.getExpenseMasterDataValues(this._currentTimesheetData).subscribe(
      (data: any) => {
        this.masterData = data?.data?.foundational_data;
        if(this.masterData?.length > 0 ){
            this.status = false;
            this.masterData.forEach(() => { this.toggleMenu.push(true);  });
        }
      });
  }
  
  getTimesheetMasterData() {
    this.timesheetService.getTimesheetMasterData(this._currentTimesheetData).subscribe(
      (data: any) => {
        this.isMdtAllow = data?.data?.header?.is_allow;
        if(this.isMdtAllow){
          this.getTimesheetMasterDataValues();
        }
      });
  } 
  
  
  
  getTimesheetMasterDataValues() {
    this.timesheetService.getTimesheetMasterDataValues(this._currentTimesheetData).subscribe(
      (data: any) => {
        this.masterData = data?.data?.foundational_data;
        if(this.masterData?.length > 0 ){
            this.status = false;
            this.masterData.forEach(() => { this.toggleMenu.push(true);  });
        }
      });
  }

  collapseMD(){
    this.status = !this.status;       
  }

  dropdownToggle(index){
    this.masterData.forEach((element,i) => {
        this.toggleMenu[i] = true;
        if(index == i){
            this.toggleMenu[index] = false;       
        }        
    });
  }

  leave(e){
    this.masterData.forEach((element,i) => {
        this.toggleMenu[i] = true;
    });
  }

}
