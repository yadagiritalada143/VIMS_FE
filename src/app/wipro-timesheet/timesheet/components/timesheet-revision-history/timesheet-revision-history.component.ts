import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { StorageService } from 'src/app/core/services/storage.service';
import { TimesheetConstants } from 'src/app/wipro-timesheet/timesheet.enums';
import { TimesheetService } from 'src/app/wipro-timesheet/timesheet.service';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';

@Component({
  selector: 'app-timesheet-revision-history',
  templateUrl: './timesheet-revision-history.component.html',
  styleUrls: ['./timesheet-revision-history.component.scss']
})
export class TimesheetRevisionHistoryComponent implements OnInit {

  @Output() reloadPage = new EventEmitter();
  @Input() set timesheetId(timesheet_id: string) {
    if(timesheet_id){
      this.timesheet_id =timesheet_id;
      this.getTimesheetRevisionHistory(timesheet_id);
    }
  }
  public timesheet_id:string= undefined;
  public vmsData: any;
  dataLoading = true;
  public tableLoaded = false;
  public totalRecords = 0;
  public itemPerPage: number = 10;
  countData:number=0;
  tableConfig:VMSConfig;
  configData:any={};
  timesheetData:any;
  constructor(private timesheetService: TimesheetService,
    private storageService: StorageService,
    public router:Router,
    public alert:AlertService,
    public loader:LoaderService,
    private route: ActivatedRoute,
    ) { }

  ngOnInit(): void {
    this.tableConfig = {
      title: '',
      columnList: [
        { name: 'code', title: 'Timesheet ID', width: 30, isIcon: true, isImage: true, isContact: false, isNumberBadge: false, isNoOption: true, toolTipVisibility: true },
        { name: 'status', title: 'Status', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'work_period', title: 'Work Period', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'total_hours', title: 'Total Hours', width: 20, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        // { name: 'total_amount', title: 'Total amount', width: 20, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isOpenView: true },
        { name: 'assignment', title: 'Assignment Title(ID)', width: 20, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isOpenView: true, permission: 'view_assignment' },
        // { name: 'assignment_code', title: 'Assignment Code', width: 20, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'vendor.name', title: 'Vendor Name', width: 20, isIcon: true, isImage: true, isContact: false, isNumberBadge: false, isNoOption: true },
        { name: 'hierarchy.name', title: 'Hierarchy', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'work_location.name', title: 'Work Location', width: 30, isIcon: false, isImage: false, isContact: false, isNumberBadge: false },
        { name: 'is_invoiced', title: 'Invoice Status', width: 30, isIcon: false, isImage: false, isContact: false, isNumberBadge: false }
      ],
      showTabs: false,
      isExpand: false,
      isFilter: false,
      isSearch: false,
      isSetting: false,
      isTopPagination: false,
      isSelectSubmitButton : false,
      isCreate: false,
      density: 'COMFORTABLE',
      tableWidth: "100%",
    };
    // this.getTimesheetRevisionHistory();
  }


  getTimesheetRevisionHistory(timesheet_id, pageNo = 1){
    let pagination= `page=${pageNo}&limit=${this.itemPerPage}`;
    if(timesheet_id){
      this.timesheetService.getTimesheetRevisionHistory(timesheet_id, pagination).subscribe(
        {next: (resp: any) => {
          this.dataLoading = false;
          let timesheets = [];
          this.vmsData= resp.data;
          this.countData= resp?.data.pagination?.total_records;
          if (resp?.data?.timesheet) {
            resp?.data?.timesheet?.forEach(item => {
              // const start_date = this.getDate(item?.start_date);
              // const end_date= this.getDate(item?.end_date); //new Date(duration?.start_date+ " 00:00:00"); fixed for safari
              // let work_period= start_date?.getDate() + ' ' +start_date?.toLocaleString('default', { month: 'short' })+ ' '+ start_date.getFullYear() +' - ' +end_date?.getDate()  + ' '+ end_date.toLocaleString('default', { month: 'short' })+ ' '+ end_date.getFullYear();
              let title: string = item?.assignment_title || '';
              if (item?.assignment_code) {
                title += ' (' + item?.assignment_code + ')';
              }
              let timesheet = {
                ...item,
                "code": item?.code,
                "timesheet_manager_name": item?.timesheet_manager?.name ? this.removeUnwanted(item?.timesheet_manager?.name) : item?.timesheet_manager?.name,
                "worker_name": item?.user?.name ? this.removeUnwanted(item?.user?.name) : '',
                // "status": item?.status ? item.status.charAt(0).toUpperCase() + item.status.substr(1).toLowerCase() : '',
                "id": item?.id,
                "work_period": this.timesheetService.getFormattedDate(item?.start_date, item?.end_date, item?.meta_data?.layout?.duration),
                "assignment": title,
                "days": item?.total_days,
                "total_billable_amount": item?.total_amount ? item?.total_amount : '-'
              }
              timesheets.push(timesheet);
            });
            this.vmsData.timesheets = timesheets;
        }
        },error : err=>{
          this.dataLoading = false;
        } }
       );
    }else{
      this.vmsData.timesheets= [];
    }
  }

  getDate(dateString: string){
    const date = dateString?.split("-");
    if (date?.length === 3) {
      return new Date(parseInt(date[0]), parseInt(date[1]) - 1, parseInt(date[2]), 0, 0, 0, 0);
    }else{
      return new Date(dateString);
    }
  }
  removeUnwanted(str) {
    const regex = /\bMR\b|\bMrs\b|\bMr\b|\bMiss\b|\bDr\b|\bProf\b|\bMX\b|\bIND\b|\bMisc\b|\bJr\b|\bSr\b|\bIII\b|\bIV\b|\bV\b/g;
    return str?.replace(regex,'');
  }

  onClickView(event) {
    const queryParams = { timesheetId: null };
    this.router.navigate(
      [],
      {
        relativeTo: this.route,
        queryParams: queryParams,
        queryParamsHandling: 'merge',
      });
      setTimeout(() => {
        this.storageService.set(TimesheetConstants.TIMESHEET, event, true);
        this.reloadPage.emit();
      }, 10);
    
  }

  onPaginationClick(e){
    this.getTimesheetRevisionHistory(e);
  }

}
