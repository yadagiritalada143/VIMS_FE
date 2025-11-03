import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { TimesheetService } from 'src/app/wipro-timesheet/timesheet.service';
import { RuleConfigurationService } from '../../rule-configuration/rule-configuration.service';
import { VMSConfig } from 'src/app/library/smartTable/table/table.model';


@Component({
  selector: 'app-impacted-assignment-details',
  templateUrl: './impacted-assignment-details.component.html',
  styleUrls: ['./impacted-assignment-details.component.scss']
})
export class ImpactedAssignmentDetailsComponent implements OnInit {
  throttle = 300;
  scrollDistance = 1;
  scrollUpDistance = 2;
  direction = "";
  array = [];
  sum = 10;
  impactedAssignmentList = [];
  impactedTimesheetList = [];
  loader: boolean = false;
  selectedAssignmentId = 0;
  public tableConfig: VMSConfig;
  public mode: string;
  public configId: string;
  itemPerPage: any;
  pagename: string;
  pageNo: number = 1;
  totalRecords: number;
  impactedAssignmentPageNo: number = 1;
  impactedAssignmentTotalRecords: number;
  constructor(private router: SvmsRouterService, private timesheetService: TimesheetService, private route: ActivatedRoute, private activatedRoute: ActivatedRoute, private ruleConfigurationService: RuleConfigurationService) {
    this.appendItems(0, this.sum);
    this.activatedRoute.queryParams
      .subscribe(params => {
        this.mode = params['mode'];
        this.configId = params['id'];
      })
  }

  timesheetColomnDefn() {
    return [
      {
        name: 'code',
        title: 'TIMESHEET ID',
        isIcon: true,
        isImage: true,
        isContact: false,
        isNumberBadge: false,
        isOpenView: false,
        infoIcon: false,
        isNoOption: true,
        isSort: true,
        width: 15,
      },
      {
        name: 'status',
        title: 'STATUS',
        isIcon: true,
        isImage: true,
        isContact: false,
        isNumberBadge: false,
        isOpenView: false,
        infoIcon: false,
        isNoOption: true,
        width: 15,
      },
    ];
  }

  ngOnInit(): void {
    this.tableConfig = {
      title: 'Impacted Timesheets',
      columnList: this.timesheetColomnDefn(),
      isTopPagination: false,
      tableWidth: '100%',
    };
    this.route.queryParams.subscribe(params => {
      this.pagename = params.order;
      if (params.order === 'timesheet') {
        this.getImpactedAssignments();
      }
      else if(params.order === 'rule') {
        this.getRuleConfig();
      }
    })
  }

  onScrollDown(ev) {
    const start = this.sum;
    this.sum += 20;
    this.appendItems(start, this.sum);
    this.direction = "down";
    this.impactedAssignmentPageNo = this.impactedAssignmentPageNo + 1
    if(this.impactedAssignmentList.length < this.impactedAssignmentTotalRecords) {
      if (this.pagename === 'timesheet') {
        this.getImpactedAssignments(true);
      }
      else if(this.pagename === 'rule'){
        this.getRuleConfig(true);
      }
    }
  }

  onPaginationClick = (pageNo: number) => {
    this.pageNo = pageNo;
    if(this.pagename === 'timesheet'){
    this.getImpactedTimesheets();
    }
    else if (this.pagename === 'rule'){
      this.getRuleTimesheets();
    }
  }

  changerecords(event: any) {
    this.loader = true;
    let payload = {
      page: 1,
      per_page: event,
      assignment_id: this.selectedAssignmentId,
      status: "inactive"
    }
    if(this.pagename === 'timesheet') {
    this.timesheetService.getImpactedTimesheet(payload, this.configId).subscribe((res: any) => {
      this.loader = false;
      this.impactedTimesheetList = res?.data?.impacted_list;
      this.itemPerPage = res?.data?.pagination?.per_page;
      this.totalRecords = res?.data?.pagination?.total_records;
    },
      (err) => {
        this.loader = false;
      })
    }
    else {
      this.ruleConfigurationService.getTimesheetRuleConfig(payload, this.configId).subscribe((res:any)=>{
        this.loader = false;
        this.impactedTimesheetList = res?.data?.impacted_list;
        this.itemPerPage = res?.data?.pagination?.per_page;
        this.totalRecords = res?.data?.pagination?.total_records;
      },
      (err) => {
        this.loader = false;
      })
    }
  }

  getImpactedAssignments(onScroll = false) {
    let payload = {
      page: this.impactedAssignmentPageNo,
      per_page: 10,
      status: "inactive"
    }
    this.timesheetService.getImpactedAssignment(payload, this.configId).subscribe((res: any) => {
      this.impactedAssignmentTotalRecords = res?.data?.pagination?.total_records;
      if (onScroll) {
        this.impactedAssignmentList = [...this.impactedAssignmentList, ...res?.data?.impacted_list];
      }
      else {
        this.impactedAssignmentList = res?.data?.impacted_list;
      }
      if (this.impactedAssignmentList?.length && !onScroll) {
        this.getImpactedTimesheets(this.impactedAssignmentList[0].id);
      }
    })
  }
  
getRuleConfig(onScroll = false){
  let payload = {
    page: this.impactedAssignmentPageNo,
    per_page: 10,
    status: "inactive"
  }
  this.ruleConfigurationService.getAssignmentRuleConfig(payload, this.configId).subscribe((res: any)=>{
    this.impactedAssignmentTotalRecords =  res?.data?.pagination?.total_records;
    if(onScroll){
      this.impactedAssignmentList = [...this.impactedAssignmentList, ...res?.data?.impacted_list];
    }
    else {
      this.impactedAssignmentList = res?.data?.impacted_list;
    }
    if(this.impactedAssignmentList?.length && !onScroll) {
      this.getRuleTimesheets(this.impactedAssignmentList[0].id);
    }
  })
 }

  getImpactedTimesheets(id?: any) {
    this.loader = true;
    if (!!id) this.selectedAssignmentId = id;
    let payload = {
      page: this.pageNo,
      per_page: 10,
      assignment_id: this.selectedAssignmentId,
      status: "inactive"
    }
    this.timesheetService.getImpactedTimesheet(payload, this.configId).subscribe((res: any) => {
      this.loader = false;
      this.impactedTimesheetList = res?.data?.impacted_list;
      this.itemPerPage = res?.data?.pagination?.per_page;
      this.totalRecords = res?.data?.pagination?.total_records;
    },
      (err) => {
        this.loader = false;
      })
  }
   
  onAssignmentClick(id) {
    if (this.pagename === 'timesheet') {
      this.getImpactedTimesheets(id)
    }
    else {
      this.getRuleTimesheets(id)
    }
  }
  
  getRuleTimesheets(id?: any){
    this.loader = true;
    if(!!id) this.selectedAssignmentId = id;
    let payload = {
      page: this.pageNo,
      per_page: 10,
      assignment_id: this.selectedAssignmentId,
      status: "inactive"
    }
    this.ruleConfigurationService.getTimesheetRuleConfig(payload, this.configId).subscribe((res:any)=>{
      this.loader = false;
      this.impactedTimesheetList = res?.data?.impacted_list;
      this.itemPerPage = res?.data?.pagination?.per_page;
      this.totalRecords = res?.data?.pagination?.total_records;
    },
    (err) => {
      this.loader = false;
    })
  }

  addItems(startIndex, endIndex, _method) {
    for (let i = 0; i < this.sum; ++i) {
      // this.array[_method]([i, " ", this.generateWord()].join(""));
    }
  }

  appendItems(startIndex, endIndex) {
    this.addItems(startIndex, endIndex, "push");
  }

  prependItems(startIndex, endIndex) {
    this.addItems(startIndex, endIndex, "unshift");
  }

  backClicked() {
    if (this.pagename === 'timesheet') {
      this.router.navigate(['configuration', 'timesheet', 'create'], { queryParams: { id: this.configId, mode: 'view' } });
    } else if (this.pagename === 'rule') {
      this.router.navigate(['configuration', 'timesheet-rule', 'create'], { queryParams: { id: this.configId, mode: 'view' } });
    }
  }
  onUp(ev) {
    this.direction = "up";
  }

}
