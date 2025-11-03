import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { debounceTime, Subject,distinctUntilChanged } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import {
  EventStreamService,
  Events,
  EmitEvent,
} from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { ITableOptions, ITablePaginationConfig } from 'src/app/library/svms-table/svms-table.model';
import { ConfigurationMode } from 'src/app/program-setup/expense-configuration/enums/configuration-mode.enums';
import { TimesheetConfigurationService } from 'src/app/program-setup/timesheet-configuration/timesheet-configuration.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { TimesheetType,TimesheetWeeklyType } from 'src/app/wipro-timesheet/timesheet.enums';
import { TimesheetService } from 'src/app/wipro-timesheet/timesheet.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { LoaderService } from 'src/app/core/components/loader/loader.service';

@Component({
  selector: 'app-create-new',
  templateUrl: './create-new.component.html',
  styleUrls: ['./create-new.component.scss']
})
export class CreateNewComponent implements OnInit {
  public hierarchies:any = null;
  currentprogram: any = undefined;
  defaultHierarchy: string[] = [];
  userAssociateHierarchy: string[] = [];
  public selections: Array<string> = [];
  public defaultSelections: Array<string> = [];
  isHierarchySelected:boolean= false;
  public mode:string= undefined;
  remoteWorkerLocation:boolean = false;
  public readonly configurationMode = ConfigurationMode;
  public locations: Array<Object> = [];
  workLocation = new Subject<string>();
  private pageNo = 0;
  public itemPerPage = 10;
  public tablePaginationConfig: ITablePaginationConfig;

  public request: any = {};
  public options: any = {};
  public selectedTimesheet:any=[];
  allCountryList: any[] = [];
  stateList: any[] = [];
  countyList :any[] = [];
  cityList :any[] =[];
  countyChange :boolean = false;
  cityChange: boolean = false;
  @Input() patchData;
  countryChange: boolean = false;
  stateChange: boolean = false;
  loadingData: boolean = false;
  isValidData: any;
  public uploadLevel = null;
  public foundationalFields:any=[];
  public timesheetWeeklyType = TimesheetWeeklyType;
  public customFields:any=[];
  public customProjects:any=[];
  public secondProjects:any=[];
  public secondProjectsDropdown:any=[];
  public saveInprogress = false;
  public configId:string= undefined;
  public projectTypes:any=[];
  public masterDataTypes:any=[];
  public selectedHourAllocFormat: any
  public titoTimeFormatValue:any;
  public timeSheetTypeValue: any;
  isDialogVisible: boolean = false;
  rateFactorAllowed: boolean = false;
  isBreakTiming: boolean = false;
  impactedAssignmentsCount: number;
  timesheetList: any = [];
  history: Array <any> = [];
  logs: Log = undefined;
  public notesValue: Array<any> = [
    { is_allow: true,is_madatory:false,value:"optional", name: "Optional" },
    {is_allow: true,is_madatory:true,value:"mandatory", name: "Manadatory" },
    { is_allow: true,is_madatory:false,value:"disabled", name: "Disabled" },
  ];
  public allowUpload: Array<any> = [
    { is_allow: true,is_madatory:false,value:"optional", name: "Optional" },
    {is_allow: true,is_madatory:true,value:"mandatory", name: "Manadatory" },
  ];
  public hourFormat: Array<any> = [
    { value:"hh:mm", name: "HH:MM" }
  ];
  public weekStartDay: Array<any> = [
    { value:"monday", name: "Monday" },
    {value:"tuesday", name: "Tuesday" },
    {value:"wednesday", name: "Wednesday" },
    {value:"thursday", name: "Thursday" },
    {value:"friday", name: "Friday" },
    {value:"saturday", name: "Saturday" },
    {value:"sunday", name: "Sunday" },

  ];
  public weekNumbers:Array<any> = [
    { value:1, name: 1 },
    {value:2, name: 2 },
    {value:3, name: 3 },
    {value:4, name: 4 },
  ]
  public monthStartDays:
  Array<any> = [
    { value:1, name: 1 },
    // {value:2, name: 2 },
    // {value:3, name: 3 },
    // {value:4, name: 4 },
    // {value:5, name: 5 },
    // {value:6, name: 6 },
    // {value:7, name: 7 },
    // {value:8, name: 8 },
    // {value:9, name: 9 },
    // {value:10, name: 10 },
    // {value:11, name: 11},
    // {value:12, name: 12},
    // {value:13, name: 13},
    // {value:14, name: 14},
    // {value:15, name: 15},
    // {value:16, name: 16},
    // {value:17, name: 17},
    // {value:18, name: 18},
    // {value:19, name: 19},
    // {value:20, name: 20 },
    // {value:21, name: 21 },
    // {value:22, name: 22 },
    // {value:23, name: 23},
    // {value:24, name: 24 },
    // {value:25, name: 25 },
    // {value:26, name: 26 },
    // {value:27, name: 27},
    // {value:28, name: 28}

  ]

  public allowTimesheetSubmit: Array<any> = [
    { is_allow: true,is_madatory:false,value:"anyDay", name: "Any day of the work period" },
    {is_allow: true,is_madatory:true,value:"lastDay", name: "Last day of the work period" },
  ];
  public allowVendorToPerformModification: Array<any> = [
    { value:"Days", label: "Days" },
  ];
  public weeklySelectedValue:string="disabled"
  public dailySelectedValue:string="disabled"
  public activitySelectedValue:string="disabled"
  public allowUploadValue:string="optional"
  public allowTimesheetSubmitted:string = "anyDay"

  dayType = [
    { value: 0.25, name: 'Quarter Day', checked: true },
    { value: 0.50, name: 'Half Day', checked: true },
    { value: 0.75, name: '3 Quarter Day', checked: true },
    { value: 1, name: 'Day', checked: true }
  ];
  calendarOptions: any = {
    language: 'English',
    range: false,
    enabledDateRanges: [
      { start: Date.now() },
    ]
  };
  dateFormat:string = DATE_FORMAT.FORMATDDMMYY;

  public titleToggle = {
    title: 'active',
    value: true
  };
  public project = {
    value: true
  };
  public tsNotes = {
    value: true
  }
  public breakTime = {
    value: true
  }
  public modificationRule = {
    value: true
  }
  public timesheetEntries = {
    value: true
  }
  copytimesheet: boolean = true;
  deleteTimesheet: boolean = true;

  public manualUpload = {
    value: true
  }
  totalRecords: number;
  public tableOptions: ITableOptions;
  isToggleChanged: boolean;
  isActiveToggle: any = undefined;
  isToggled: boolean;
  ruleConfigs: any;
  allocationType: any;
  constructor(private eventStream: EventStreamService,
    private timesheetService : TimesheetService,
    private storageService: StorageService,
    private timeSheetConfigService: TimesheetConfigurationService,
    private alertService: AlertService,
    private router: SvmsRouterService,
    private route: SvmsRouterService,
    private activatedRoute: ActivatedRoute,
    private datePipe: LocalDateFormatPipe,
    private activateRoute: ActivatedRoute,
    private sortPipe : SortHelperPipe,
    private loaderService: LoaderService, 
    ) {
      this.mode = this.activateRoute.snapshot.paramMap.get('mode');
      this.configId = this.activateRoute.snapshot.paramMap.get('id');
      this.workLocation.pipe(debounceTime(300), distinctUntilChanged()).subscribe((value: any) => {
        this.getWorkLocations(value?.term, true);
      });
   }
  tableColomnDefn = [
    { field: 'code', header: 'TIMESHEET ID', width: 5, order: 1, sortable: true, primary: true },
    { field: 'user.name', header: 'WORKER NAME', width: 5, order: 2, primary: true },
    { field: 'desc', header: 'ASSIGNMENT NAME & ID', width: 5, order: 3, primary: true }
  ];
  ngOnInit(): void {
    this.currentprogram= this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.dateFormat = this.currentprogram?.defaultDateFormat.toUpperCase();
    this.remoteWorkerLocation = this.currentprogram?.config?.manage_remote_workers;
    this.getWorkLocations(undefined, true);
    this.createForm();
    this.loadForm();
    this.getHierarchy();
    this.getCustomFields();
    this.getRateFactors();
    this.getTimesheetType();
    this.getFoundationalTypes();
    setTimeout(() => {
      this.activatedRoute.queryParams
      .subscribe(params => {
        this.mode = params['mode'];
        this.configId= params['id'];
      if(this.mode && this.configId){
          this.loadTimesheetConfiguration();
          this.loadTSConfigurationHistory();
      }
      else {
        if(this.remoteWorkerLocation){
        this.getAllCountry();
        }
      }
    });
  },1000)
  }

  onPaginationClick = (pageNo: number) => {
    this.pageNo = pageNo;
    this.getImpactedTimesheetlist()
  }

  backClicked() {
    this.router.navigate(['configuration', 'timesheet', 'list']);
  }

  showImpactedAssignment() {
    this.router.navigate(['configuration', 'timesheet', 'impacted-assignment-details'], { queryParams: { order: 'timesheet', id: this.configId } });
  }

  getAllCountry() {
    this.loaderService.show();
    this.timesheetService.getCountries().subscribe({
      next: data => {
        if (data) {
          this.loaderService.hide();
          this.allCountryList = this.sortPipe.transform(data['countries'], 'name');
          if (this.request?.remote_country?.length) {
            this.getAllStates(this.request?.remote_country);
          }    
      }
    },
      error: (error) => {
        this.loaderService.hide();
      }
  })
}
  changeCountry(event) {
    if(!event.length){
      this.stateList = [];
      this.cityList = [];
      this.countyList = [];
      this.request.remote_state = [];
      this.request.remote_county = [];
      this.request.remote_city = [];
  }
    if (!!event?.length) {
      this.countryChange = true;
      this.getAllStates(event);
    }
  }
  getAllStates(countryId) {
    this.loaderService.show();
    this.timesheetService.getStates(countryId).subscribe({
      next: data => {
        if (data) {
          this.loaderService.hide();
          this.stateList = this.sortPipe.transform(data['states'], 'name');
          if(this.request?.remote_state?.length) {
            this.request.remote_state = this.stateList?.filter((state) => this.request?.remote_state.includes(state?.id)).map(val => val?.id);
          }
          if(this.request?.remote_state?.length && (this.loadingData || this.countryChange)) {
            this.loadingData = false;
            this.getAllCounties(this.request?.remote_state);
            this.getAllCities(this.request?.remote_state);
          }
          else {
            this.request.remote_county = [];
            this.request.remote_city = [];
          }
        }
      },
      error: (error) => {
        this.loaderService.hide();
      }
    })
  }
  changeState(event) {
    if (!event?.length){
      this.cityList = [];
      this.countyList = [];
      this.request.remote_county = [];
      this.request.remote_city = [];
    }
    if (!!event?.length) {
      this.getAllCounties(event);
      this.getAllCities(event);
      this.stateChange = true;
    }
  }
  
  getAllCounties(stateId) {
    this.loaderService.show();
    this.timesheetService.getCounties(stateId).subscribe({
      next: data => {
        if (data) {
          this.loaderService.hide();
          this.countyList = this.sortPipe.transform(data['counties'], 'name');
          if(this.request?.remote_county?.length) {
            this.request.remote_county = this.countyList?.filter((county) => this.request?.remote_county.includes(county?.id)).map(val => val?.id);
          }
        }
      },
      error: (error) => {
        this.loaderService.hide();
      }
    })
  }

  changeCounty(event) {
    if (!!event?.length) {
      this.countyChange = true;
    }
  }
  getAllCities(stateId) {
    this.loaderService.show();
    this.timesheetService.getCities(stateId).subscribe({
      next: data => {
        if (data) {
          this.loaderService.hide();
          this.cityList = this.sortPipe.transform(data['cities'], 'name');
          if(this.request?.remote_city?.length) {
            this.request.remote_city = this.cityList?.filter((city) => this.request?.remote_city.includes(city?.id)).map(val => val?.id);
          }
        }
      },
      error: (error) => {
        this.loaderService.hide();
      }
    })
  }

  changeCity(event) {
    if (!!event?.length) {
      this.cityChange = true;
    }
  }
  // get Hierarchy details
  getHierarchy() {
    const logUser = this.storageService.get(StorageKeys.CURRENT_USER);
    this.currentprogram= this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let url = '/configurator/programs/' + this.currentprogram?.id + '/hierarchy?user_id=' + logUser?.id

    this.timeSheetConfigService.get(url)
    .subscribe((data: any) => {
      if(data?.result?.length > 0) {
        this.hierarchies = data?.result;
        this.defaultHierarchy = [data.result[0].hierarchies[0].id];
        this.userAssociateHierarchy = [data.result[0].hierarchies[0].id];
      }
    });
  }

  // change on Hierarchy
  hierarchySelectionChanged(event: Array<string>) {
    this.selections = event;
  if (this.selections.length && !this.defaultSelections.length) {
    this.defaultSelections = [this.selections[0]];
  }
  if(event && event.length > 0) {
    // work on it
    // this.changeHierarchy(event, this.hierarchies);
    this.request['hierarchy_ids'] = event;
    this.getRateFactors();
    this.isHierarchySelected = true;
  } else {
    this.isHierarchySelected = false;
    this.request['hierarchy_ids']  = [];
    this.getRateFactors();
  }
}

// get Work Location
getWorkLocations(term, reset = false) {
  this.currentprogram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
  if (reset) {
    this.pageNo = 1;
  }

  const url = `/configurator/programs/${this.currentprogram?.id}/work-locations?limit=25&status=true&page=${this.pageNo}${term ? '&k=' + term : ''}`;
  this.timeSheetConfigService.get(url)
    .subscribe({
      next: (data: any) => {
        if (data && data?.work_locations && data?.work_locations?.length > 0) {
          const uniqueLocations: any = [...new Map(data?.work_locations?.map(item => [item?.name, item]))?.values()];
          const locations = uniqueLocations?.filter(l => l?.name);
          const addAll = {id: '', name: 'All'}
          this.locations = [addAll].concat(locations);
        }
      }, error: (error: Error | any) => {
        this.alertService.error(errorHandler(error), {});
      }
    }
  );
}

hideRate(val){
  if(val === TimesheetWeeklyType.AUTOMATIC){
    const data = "project-x";
    this.options.timesheetProjectTypes = this?.options?.timesheetProjectTypes.filter((item) => item.value !== data);
    this.rateFactorAllowed = true;
  }
  else if(this.rateFactorAllowed){
    const deletedObject = {
      "value": "project-x",
      "name": "Rate Type"
  }
    this.options.timesheetProjectTypes.splice(2, 0, deletedObject);
    this.rateFactorAllowed = false;
  }
  if (val === TimesheetWeeklyType.HYBRID) {
    this.secondProjectsDropdown = [...this.customProjects];
    this.request.rules.basic_rules.project.is_allow = true;
    this.projectTypes = 'Rate Type';
    this.secondProjects = [];
    this.request.rules.basic_rules.project.option = [];
  }
  else if (this.allocationType === TimesheetWeeklyType.HYBRID) {
    this.projectTypes = [];
    this.secondProjects = [];
    this.request.rules.basic_rules.project.option = [];
  }
  this.allocationType = val;
}

createForm() {
  this.options = this.timeSheetConfigService.getTimesheetDropdownOptions();
  this.options.timeSheetTypes = []
  this.selectedTimesheet = this.timeSheetConfigService.getTimesheetDropdownOptions()?.timeSheetTypes;
  this.request = this.timeSheetConfigService.getDefaultTimeSheetConfig();
  // TODO This should be async after request is populated --> this.populateUploadLevel();
  this.populateUploadLevel();
}

loadForm() {
  this.currentprogram= this.storageService.get(StorageKeys.CURRENT_PROGRAM);
  this.dateFormat = this.currentprogram?.defaultDateFormat.toUpperCase();
  const str1 = this.datePipe.transform(this.currentprogram?.start_date, this.dateFormat ,null ,null , true, DATE_FORMAT?.FORMATYMD);
  if(str1){
    this.request.start_date = str1;
    let startdate = this.currentprogram?.start_date?.split("-");
      if (startdate?.length === 3) {
        this.calendarOptions = {
          language: 'English',
          range: false,
          enabledDateRanges: [
            { start: new Date(parseInt(startdate[0]), parseInt(startdate[1]) - 1, parseInt(startdate[2]), 0, 0, 0, 0)},
          ]
        };
      }
  }else{
    this.alertService.error("Program does not have start date");
  }


}

populateUploadLevel() {
  this.options.uploadLevels.forEach(level => {
    if (this.request.rules.basic_rules.upload.option[level.value].is_allow) {
      this.uploadLevel = level.value;
    }
  });

}
updateWorkPeriodConfig(){
  if(this.request.rules.basic_rules.work_week.period?.toLowerCase() !== 'x weekly'){
    this.request.rules.basic_rules.work_week.week_number= null;
  }
  if(this.isWeekly()){
    this.request.rules.basic_rules.work_week.month_start_day= null;
  }
  if(this.request.rules.basic_rules.work_week.period?.toLowerCase() =="monthly") {
    this.request.rules.basic_rules.past_period.option.worker.type = "month";
    this.request.rules.basic_rules.past_period.option.vendor.type ="month";
    this.request.rules.basic_rules.past_period.option.msp.type ="month";
    this.request.rules.basic_rules.future_period.option.worker.type="month";
    this.request.rules.basic_rules.future_period.option.vendor.type="month";
    this.request.rules.basic_rules.future_period.option.msp.type="month"
  }
  else{
  this.request.rules.basic_rules.past_period.option.worker.type = "week";
  this.request.rules.basic_rules.past_period.option.vendor.type = "week";
  this.request.rules.basic_rules.past_period.option.msp.type = "week";
  this.request.rules.basic_rules.future_period.option.worker.type="week";
  this.request.rules.basic_rules.future_period.option.vendor.type = "week";
  this.request.rules.basic_rules.future_period.option.msp.type = "week";
  }
  /* else {
    this.request.rules.basic_rules.work_week.week_start_day= null;
  } */
}
isWeekly() {
  return this.request?.rules?.basic_rules?.work_week?.period?.toLowerCase() === 'weekly' ||
    this.request?.rules?.basic_rules?.work_week?.period?.toLowerCase() === 'bi-weekly' ||
    this.request?.rules?.basic_rules?.work_week?.period?.toLowerCase() === 'x weekly';
}

// get timesheet type
getTimesheetType() {
  this.currentprogram= this.storageService.get(StorageKeys.CURRENT_PROGRAM);
  // &hierarchy_id=${hierarchy_id}
  let url = `/configurator/programs/${this.currentprogram?.id}/picklists/*/items?picklist_slug=timesheet_type&is_enabled=true`;
  this.timeSheetConfigService.get(url).subscribe((data: any) => {
    if (data && data?.picklist_items) {
      // this.selectedTimesheet = data?.picklist_items;
    }
  })
}

isHourly() {
  return Array.isArray(this.request?.rules?.basic_rules?.timesheet_type) && this.request?.rules?.basic_rules?.timesheet_type[0]?.toLowerCase() =='hours';
  // return Array.isArray(this.request?.rules?.basic_rules?.timesheet_type) && this.request?.rules?.basic_rules?.timesheet_type?.includes('hours');
}

isDayTimesheet() {
  return this.request?.rules?.basic_rules?.timesheet_type?.find(t => { return t?.toLowerCase() === TimesheetType?.DAY?.toLowerCase()})
}

isCico() {
  return Array.isArray(this.request?.rules?.basic_rules?.timesheet_type) && this.request?.rules?.basic_rules?.timesheet_type[0]?.toLowerCase() =='cico';
}

getDayTypes() {
  let day_type = new Array();
  let data = JSON.parse(JSON.stringify(this.dayType));
  data?.forEach(day => {
    if(day?.checked) {
      delete day?.checked;
      day_type.push(day)
    }
  });
  return day_type;
}

getFoundationalTypes() {
  this.currentprogram= this.storageService.get(StorageKeys.CURRENT_PROGRAM);
  if(this.mode?.toLowerCase() == 'view'){
    this.timeSheetConfigService.get(`/configurator/programs/${this.currentprogram?.id}/foundational-data-types?limit=150`)
    .subscribe((data: any) => {
      const { foundational_data_types } = data;
      this.foundationalFields = foundational_data_types.filter(fd => {
        return fd?.configuration && fd?.configuration?.module_jobs !== 'OFF';
      }).map(fd => {
        fd.code = this.snakeCase(fd.name);
        fd.parent_type= 'foundational_data';
        return fd;
      });
    });
  }else{
    this.timeSheetConfigService.get(`/configurator/programs/${this.currentprogram?.id}/foundational-data-types?active=true&limit=50`)
    .subscribe((data: any) => {
      const { foundational_data_types } = data;
      this.foundationalFields = foundational_data_types.filter(fd => {
        return fd?.configuration && fd?.configuration?.module_jobs !== 'OFF';
      }).map(fd => {
        fd.code = this.snakeCase(fd.name);
        fd.parent_type= 'foundational_data';
        return fd;
      });
    });
  }
}

getCustomFields() {
  this.currentprogram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
  let url = `/configurator/programs/${this.currentprogram?.id}/custom-fields?entity_ref=timesheets&limit=50`;
  this.timeSheetConfigService.get(url).subscribe({
    next: (data: any) => {
      if (Array.isArray(data?.custom_fields)) {
        this.customFields = this.sortPipe.transform(
          data.custom_fields.map((cd: any) => {
            cd.parent_type = 'custom_data';
            return cd;
          })
        , 'name');
      }
    }
  });
}

getRateFactors() {
  this.currentprogram= this.storageService.get(StorageKeys.CURRENT_PROGRAM);
  if(this.options?.workerCode && this.options?.workerCode?.length){
    this.options?.workerCode?.forEach(wc => {
      wc.program = this.currentprogram?.name
    });
  }
  let url;
  if (this.request['hierarchy_ids']?.length) {
    url = `/configurator/programs/${this.currentprogram?.id}/rate-factors?limit=50&page=1&hierarchy=${this.request['hierarchy_ids']}`;
  }
  else {
    url = `/configurator/programs/${this.currentprogram?.id}/rate-factors?limit=50&page=1`;
  }
  //`/configurator/programs/${this.programDetails.id}/picklists/*/items?picklist_slug=custom_project`;
  this.timeSheetConfigService
  .get(url)
  .subscribe((response: any) => {
    if(response?.rate_factors) {
      let rateFactorList = response?.rate_factors?.filter(val => val?.is_enabled);
      this.customProjects =  rateFactorList?.map(cp => {
        let customProject={
          parent_type: 'project-x',
          id: cp.id,
          name: cp.name,
          title:  cp.name,
          rate_factor: cp.abbreviation,
          rate_type: cp.type
        };
        /* cp.combo=[];
         cp.isCombined= true;
        this.options?.projectXPredefinedValues?.forEach(project => {
          cp.combo.push({parent_type: project.parent_type, ...cp, name: cp.value+' - '+project.name, custom_project: cp.value, mappedName: project.name})
        });  */
        return customProject;
      });
      this.secondProjectsDropdown = [...this.customProjects];
    }
  });
}
mergeDeep(...objects) {
  const isObject = obj => obj && typeof obj === 'object';

  return objects.reduce((prev, obj) => {
    Object.keys(obj).forEach(key => {
      const pVal = prev[key];
      const oVal = obj[key];

      if (Array.isArray(pVal) && Array.isArray(oVal)) {
        // prev[key] = pVal.concat(...oVal);
        prev[key] = [...pVal, ...oVal].filter((element, index, array) => array.indexOf(element) === index);//for unique
      }
      else if (isObject(pVal) && isObject(oVal)) {
        prev[key] = this.mergeDeep(pVal, oVal);
      }
      else {
        prev[key] = oVal;
      }
    });

    return prev;
  }, {});
}

populateDayType(data) {
  this.dayType.forEach(dt => {
    dt.checked = false;
    data?.forEach(d => {
    if(dt?.value === d?.value){
      dt.checked = true;
    }
  });
});
}

onProjectTypeSelection(selectedProjectTypes, loadingTS = false){
  if(!loadingTS) {
    this.secondProjects=[];
  }
  this.secondProjectsDropdown= [];
  if(selectedProjectTypes){
    if(selectedProjectTypes.includes("foundational_data")){
      this.secondProjectsDropdown= [... this.secondProjectsDropdown, ...this.foundationalFields];
    }
    if(selectedProjectTypes.includes("custom_data")){
      this.secondProjectsDropdown= [... this.secondProjectsDropdown, ...this.customFields];
    }
    if(selectedProjectTypes.includes("project-x")){
      this.secondProjectsDropdown= [... this.secondProjectsDropdown, ...this.customProjects]; // ...this.options.projectXPredefinedValues,
    }
    if(selectedProjectTypes.includes("worker_code")){
      this.secondProjectsDropdown= [... this.secondProjectsDropdown, ...this.options?.workerCode];
    }
    if(selectedProjectTypes.includes("project-code-integration")){
      if (Array?.isArray(this.options.projectCodeIntegration)) {
       this.secondProjectsDropdown = [...this.secondProjectsDropdown, ...this.options.projectCodeIntegration];
     } else {
       this.secondProjectsDropdown?.push(this.options.projectCodeIntegration);
     }
   }
  }
}


   getImpactedTimesheetlist() {
    const oldStatus = this.request?.status === true ? 'inactive' : 'active';
    const newStatus = oldStatus === 'active' ? 'inactive' : 'active';
    let payLoad = {
      "per_page": this.itemPerPage,
      "page": this.pageNo,
      "status": {
        "old": oldStatus,
        "new": newStatus
      }
    }
    this.timesheetService.impactedTimesheetList(payLoad, this.configId).subscribe((res: any) => {

      this.itemPerPage = res?.data?.pagination?.per_page
      this.totalRecords =  res?.data?.pagination?.total_records;
      this.timesheetList = res?.data?.impacted_list.map((timesheet: any) =>
        timesheet
          ?
          { ...timesheet, desc: timesheet?.assignment_title + '(' + timesheet?.assignment_code + ')' }
          : timesheet
      )
   })
  }

  viewImpactedTimesheetList() {
      this.isDialogVisible = true;
  }

  onUpdateToggle() {
    let payLoad = {
      "status": this.request.is_active ? 'active' : 'inactive'
    }
    this.timesheetService.onTimesheetToggleStatusChanges(payLoad, this.configId).subscribe((val) => {
      this.isToggleChanged = false;
    })
  }
  onToggle() {
    this.request.is_active = !this.request?.is_active;
    this.request.status = !this.request?.status;
    if (this.mode === this.configurationMode.View) {
      let payLoad = {
        "status": this.request.is_active ? 'active' : 'inactive'
      }
      this.timesheetService.onTimesheetToggleStatusChanges(payLoad, this.configId).subscribe((val) => {
        let toggleText = this.request.is_active ? 'Activated' : 'Inactivated'
        this.alertService.success('Timesheet Configuration ' + toggleText + ' Sucessfully');
      })
      if (!this.request?.is_active) {
        this.isToggled = true;
        let payload = {
          page: 1,
          per_page: 10,
          status: "inactive"
        }
        this.timesheetService.getImpactedAssignment(payload, this.configId).subscribe((res: any) => {
          this.impactedAssignmentsCount = res?.data?.pagination?.total_records;
        })
      }
      else {
        this.isToggled = false;
      }
    }
    /*if(this.isActiveToggle === this.request?.is_active && this.isToggleChanged) {
      this.isToggleChanged = false;
      return;
    }
    if (this.mode === this.configurationMode?.View) {
      this.isToggleChanged = true;
      const oldStatus = this.request?.is_active === true ? 'inactive' : 'active';
      const newStatus = oldStatus === 'active' ? 'inactive' : 'active';
      let payLoad = {
        "per_page": 10,
        "page": 1,
        "status": {
          "old": oldStatus,
          "new": newStatus
        }
      }
      this.timesheetService.impactedTimesheetList(payLoad, this.configId).subscribe((res: any) => {
        this.itemPerPage = res?.data?.pagination?.per_page
        this.totalRecords =  res?.data?.pagination?.total_records;
        this.timesheetList = res?.data?.impacted_list.map((timesheet: any) =>
          timesheet
            ?
            { ...timesheet, desc: timesheet?.assignment_title + '(' + timesheet?.assignment_code + ')' }
            : timesheet
        )
        this.tablePaginationConfig = {
          itemsPerPage: this.itemPerPage,
          recordsPerPageSetting: undefined,
          onPagination: this.onPaginationClick,
        };
        this.tableOptions = {
          headerConfig: null,
          pagination: true,
          totalRecords: this.totalRecords,
          paginationConfig: this.tablePaginationConfig,
        };
      });
    } */
  }

  onModalClose() {
    this.isDialogVisible = false;
  }

// get all the value
loadTimesheetConfiguration() {
  this.currentprogram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
  const url = `/timesheet/programs/${this.currentprogram?.id}/config/basic/${this.configId}`;
  this.timeSheetConfigService.get(url)
    .subscribe({
      next: (data: any) => {
        if(data?.data?.timesheet_type === "cico"){
          this.isBreakTiming = true;
        }
        this.request = this.mergeDeep(this.request, data.data);
        this.ruleConfigs = this.request?.rule_config?.map((val) => val?.uuid);
        this.isActiveToggle = this.request.is_active;
        if(data?.data?.rules?.basic_rules?.upload?.is_mandatory){
          this.allowUploadValue = 'mandatory'
        }else {
          this.allowUploadValue = 'optional'
        }
        if(data?.data?.rules?.basic_rules?.is_enable_submit_eof_duration){
          this.allowTimesheetSubmitted = 'lastDay'
        }else{
          this.allowTimesheetSubmitted = 'anyDay'
        }
        //{...this.request, ...data.data};
        if(data?.data?.rules?.basic_rules?.notes?.option?.day_level?.is_allow && data?.data?.rules?.basic_rules?.notes?.option?.day_level?.is_mandatory) {
          this.dailySelectedValue = 'mandatory'
        }else if(data?.data?.rules?.basic_rules?.notes?.option?.day_level?.is_allow && !data?.data?.rules?.basic_rules?.notes?.option?.day_level?.is_mandatory){
          this.dailySelectedValue = 'optional'
        }else {
          this.dailySelectedValue = 'disabled'
        }

        if(data?.data?.rules?.basic_rules?.notes?.option?.project_level?.is_allow && data?.data?.rules?.basic_rules?.notes?.option?.project_level?.is_mandatory) {
          this.activitySelectedValue = 'mandatory'
        }else if(data?.data?.rules?.basic_rules?.notes?.option?.project_level?.is_allow && !data?.data?.rules?.basic_rules?.notes?.option?.project_level?.is_mandatory){
          this.activitySelectedValue = 'optional'
        }else {
          this.activitySelectedValue = 'disabled'
        }

        if(data?.data?.rules?.basic_rules?.notes?.option?.timesheet_level?.is_allow && data?.data?.rules?.basic_rules?.notes?.option?.timesheet_level?.is_mandatory) {
          this.weeklySelectedValue = 'mandatory'
        }else if(data?.data?.rules?.basic_rules?.notes?.option?.timesheet_level?.is_allow && !data?.data?.rules?.basic_rules?.notes?.option?.timesheet_level?.is_mandatory){
          this.weeklySelectedValue = 'optional'
        }else {
          this.weeklySelectedValue = 'disabled'
        }
        if (data?.data?.rules?.basic_rules?.day_type) {
          this.populateDayType(data?.data?.rules?.basic_rules?.day_type);
        }
        if (data?.data?.rules?.basic_rules?.timesheet_start_date) {
          // this.request.start_date=  data?.data?.rules?.basic_rules?.timesheet_start_date;
          this.request.start_date = this.datePipe.transform(data?.data?.rules?.basic_rules?.timesheet_start_date, this.dateFormat ,null ,null , true, DATE_FORMAT?.FORMATYMD)
          // let startdate = this.request.start_date?.split("-");
          let startdate = data?.data?.rules?.basic_rules?.timesheet_start_date?.split("-");
          if (startdate?.length === 3) {
            this.calendarOptions = {
              language: 'English',
              range: false,
              enabledDateRanges: [
                { start: new Date(parseInt(startdate[0]), parseInt(startdate[1]) - 1, parseInt(startdate[2]), 0, 0, 0, 0) },
              ]
            };
          }
        }
        if(this.request?.rules?.basic_rules?.hour_type_calculation === "automation"){
          this.hideRate("automation");
        }
        
        this.logs = undefined;
        this.copytimesheet= this.request?.rules?.basic_rules?.copy_timesheet?.is_allow;
        this.deleteTimesheet = this.request?.rules?.basic_rules?.soft_delete?.is_allow;
        this.modificationRule.value = this.request?.rules?.basic_rules?.hours_modification_period?.is_allow;
        // this.currentprogram.config.bulk_timesheet_approval = data?.data?.rules?.basic_rules?.is_allow_mass_approval;
        if(this.request?.location){
          this.locations = [... this.locations, ... this.request?.location];
          this.locations = [...new Map(this.locations?.map(item => [item['id'], item]))?.values()];
          this.request.location = this.request?.location.map(n => n.id);
        }else {
          this.request.location = ['']
        }
        if (this.mode != ConfigurationMode.Clone) {
          this.request.hierarchy = data?.data?.hierarchy;
          this.request.hierarchy_id = data?.data?.hierarchy?.id;
          // this.defaultHierarchy = [data?.data?.hierarchy?.id];
          if(this.request?.hierarchies){
          this.defaultHierarchy= this.request?.hierarchies.map(n => n.id);
          this.selections = this.defaultHierarchy;
        this.request['hierarchy_ids'] = this.request?.hierarchies?.map(n => n.id);
          }else {
            this.defaultHierarchy= [this.request?.hierarchy?.id];
          this.request.hierarchy.name = this.request?.hierarchy?.name;
        this.request['hierarchy_ids'] = this.request?.hierarchy?.id;
        this.selections = this.defaultHierarchy;
          }
          this.isHierarchySelected = true;
        } else {
          this.isHierarchySelected = false;
          this.defaultHierarchy = [];
          this.request.hierarchy = { id: null, name: null };
          this.request.title = 'clone-' + this.request.title || '';
          this.request.hierarchy = data?.data?.hierarchy;
          this.request.hierarchy_id = data?.data?.hierarchy?.id;
          if(this.request?.hierarchies){
            this.defaultHierarchy= this.request?.hierarchies.map(n => n.id);
            this.request['hierarchy_ids'] = this.request?.hierarchies.map(n => n.id);
            this.selections = this.defaultHierarchy;
          // this.request['hierarchy_ids'] = this.request?.hierarchy_ids.map(n => n.id);
            }else {
              this.defaultHierarchy= [this.request?.hierarchy?.id];
            this.request.hierarchy.name = this.request?.hierarchy?.name;
          // this.request['hierarchy_ids'] = this.request?.hierarchy?.id;
          this.selections = this.defaultHierarchy;
            }
        }
        if (this.request.rules.basic_rules.project.option?.length > 0) {
          this.projectTypes = this.request?.rules?.basic_rules?.project.option?.map(item => item?.parent_type)
            .find((value, index, self) => { if (value) { return self?.indexOf(value) === index } }); 
          // if (this.request?.rules?.basic_rules?.hour_type_calculation === "hybrid") {
          //   this.projectTypes = "Rate Type";
          // }
          this.onProjectTypeSelection(this.projectTypes, true);
          this.secondProjects = this.request?.rules?.basic_rules?.project?.option?.map(item => (item?.name || item?.title))
            .filter((value, index, self) => self?.indexOf(value) === index);
        }

        if (this.request.rules.basic_rules.header?.foundational_data?.value.length > 0) {
          this.masterDataTypes = []
          this.masterDataTypes  = this.request?.rules?.basic_rules?.header?.foundational_data?.value;
        }
        if(this.remoteWorkerLocation){
        if(this.request?.location_type) {
          this.request?.location_type.forEach((val) => {
            if(val === "work") {
              this.request.rules.basic_rules.workLocation = true;
            }
            else if(val === "remote") {
              this.request.rules.basic_rules.remoteWorkerLocation= true;
            }
          })
        }
        this.loadingData = true;
        this.request.remote_country = this.request?.remote_country?.map(val => val?.id);
        this.request.remote_state =  this.request?.remote_state?.map(val => val?.id);
        this.request.remote_city =  this.request?.remote_city?.map(val => val?.id);
        this.request.remote_county =  this.request?.remote_county?.map(val => val?.id);

        this.getAllCountry();
      }
        // this.request= Object.assign({}, this.request, data.data);
      }, error: (error: Error | any) => {
        this.saveInprogress = false;
        if (error?.error?.error?.errors && error?.error?.error?.errors[0] && error?.error?.error?.errors[0].message) {
          // this.alertService.error(error?.error?.error?.errors[0].message);
          this.showError(error);
        } else {
          this.alertService.error('Error While Saving Timesheet Configuration.');
        }
      }
    }
  );
}

loadTSConfigurationHistory() {

  this.logs = undefined;
  this.currentprogram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
  const url = `/timesheet/programs/${this.currentprogram?.id}/config/basic/${this.configId}/history`;
  this.timeSheetConfigService.get(url)
    .subscribe({
      next: (data: any) => {

        // Modified history object
        if(data?.data?.length){
        data?.data?.forEach(obj => {
          obj.date = obj?.created_at.split(' ')[0].replace('-', '/')?.replace('-', '/');
          obj.time = obj?.created_at.split(' ')[1];
          obj.name = obj?.created_by?.name;
        });
      }
        this.history = data?.data;

      }, error: (error: Error | any) => {
        this.saveInprogress = false;
        if (error?.error?.error?.errors && error?.error?.error?.errors[0] && error?.error?.error?.errors[0].message) {
          //  this.alertService.error(error?.error?.error?.errors[0].message);
          this.showError(error);
        } else {
          this.alertService.error('Error While Saving Timesheet Configuration.');
        }
      }
    }
  );
}
  onClickToggle() {
    if (this.titleToggle.value) {
      this.titleToggle.value = false;
      this.titleToggle.title = 'inactive';
    } else {
      this.titleToggle.value = true;
      this.titleToggle.title = 'active';
    }
  }

  onClickToggleProject() {
    if (this.project.value) {
      this.project.value = false;
    } else {
      this.project.value = true;
    }
  }

  onClickToggleNotes() {
    // if (this.tsNotes.value) {
    //   this.tsNotes.value = false;
    // } else {
    //   this.tsNotes.value = true;
    // }
    this.request.rules.basic_rules.notes.is_allow = !this.request.rules.basic_rules.notes.is_allow;
    if(!this.request.rules.basic_rules.notes.is_allow){
      this.request.rules.basic_rules.notes.option.week_level.is_allow= false;
      this.request.rules.basic_rules.notes.option.week_level.is_mandatory= false;
      this.request.rules.basic_rules.notes.option.day_level.is_allow= false;
      this.request.rules.basic_rules.notes.option.day_level.is_mandatory= false;
    }
  }

  onClickToggleBreakTime() {
    if (this.breakTime.value) {
      this.breakTime.value = false;
    } else {
      this.breakTime.value = true;
    }
  }

  onClickToggleModification() {
    if (this.modificationRule.value) {
      this.modificationRule.value = false;
      this.request.rules.basic_rules.hours_modification_period.is_allow= false;
          this.request.rules.basic_rules.hours_modification_period.option= {
        "client": {
            "is_allow": true,
            "period": 0,
            "type": "day",
            "applicable_on": null
        },
        "vendor": {
             "is_allow": true,
            "period": 0,
            "type": "day",
            "applicable_on": null
        },
        "msp": {
             "is_allow": true,
            "period": 0,
            "type": "day",
            "applicable_on": null
        }
    }
    } else {
      this.modificationRule.value = true;
      this.request.rules.basic_rules.hours_modification_period.is_allow= true;
    }
  }

  onClickToggleEntries() {
    if (this.timesheetEntries.value) {
      this.timesheetEntries.value = false;
    } else {
      this.timesheetEntries.value = true;
    }
  }

  toggleChanged(copy) {
    if(copy) {
      this.copytimesheet = !this.copytimesheet;
      this.request.rules.basic_rules.copy_timesheet.is_allow =  this.copytimesheet;
    }
  }

  toggleChangeValue() {
      this.request.rules.basic_rules.grace_period.is_allow = !this.request.rules.basic_rules.grace_period.is_allow;
      // if(!this.request.rules.basic_rules.grace_period.is_allow){
        this.request.rules.basic_rules.grace_period.option = [];
        this.request.rules.basic_rules.grace_period.option = this.convertPeriod(this.request?.rules?.basic_rules?.grace_period?.option,'grace_period');
      // }
  }

  toggleFutureTimesheet() {
    this.request.rules.basic_rules.future_period.is_allow = !this.request.rules.basic_rules.future_period.is_allow;
  }

  togglePastTimesheet(){
    this.request.rules.basic_rules.past_period.is_allow = !this.request.rules.basic_rules.past_period.is_allow;
  }

  toggleDelete(deletetimesheet) {
    if(deletetimesheet) {
      this.deleteTimesheet = !this.deleteTimesheet;
      this.request.rules.basic_rules.soft_delete.is_allow = this.deleteTimesheet
    }
  }

  toggleOverrideRule(event) {
    this.request.rules.basic_rules.disable_override_rule = !this.request?.rules?.basic_rules?.disable_override_rule;
  }

  toggleHoursValidate(event){
  this.request.rules.basic_rules.disable_hours_validate = !this.request?.rules?.basic_rules?.disable_hours_validate;
  }
  toggleAmountVisibility(event){
    this.request.rules.basic_rules.is_enable_amount_visibility = !this.request?.rules?.basic_rules?.is_enable_amount_visibility;
  }
  toggleDayVisibility(event){
    this.request.rules.basic_rules.is_enable_day_visibility = !this.request?.rules?.basic_rules?.is_enable_day_visibility;
  }

  onClickToggleManualUpload() {
    if (this.manualUpload.value) {
      this.manualUpload.value = false;
    } else {
      this.manualUpload.value = true;
    }
  }


  openBreakModal(event) {
    if(event) {
      this.eventStream.emit(new EmitEvent(Events.ADD_BREAK_RULE, true));
    }
  }

  // get project Value
  selectionProject(value: any, loadConfig = false) {
    // this.secondProjects = value;
    this.projectTypes = value
    this.onProjectTypeSelection(value, loadConfig);
  }

  // master data type
  selectionMasterDataTypes(value: any) {
    this.masterDataTypes = value
  }

  // get project option value
  selectionPrjectOption(value: any) {
    this.secondProjects = value;
    // this.onProjectTypeSelection(value);
  }

  // get weekly notes value
  timesheetNotesSelected(value: any) {
    this.weeklySelectedValue = value;
    if(value == 'optional'){
    this.request.rules.basic_rules.notes.option.timesheet_level.is_allow = true;
    this.request.rules.basic_rules.notes.option.timesheet_level.is_mandatory = false;
  }  else if(value == 'mandatory'){
    this.request.rules.basic_rules.notes.option.timesheet_level.is_allow = true;
    this.request.rules.basic_rules.notes.option.timesheet_level.is_mandatory = true;
  }else {
    this.request.rules.basic_rules.notes.option.timesheet_level.is_allow = false;
    this.request.rules.basic_rules.notes.option.timesheet_level.is_mandatory = false;
  }
  }

  // get daily notes value
  dailyNotesSelected(value: any){
    this.dailySelectedValue = value;
    if(value == 'optional'){
    this.request.rules.basic_rules.notes.option.day_level.is_allow = true;
    this.request.rules.basic_rules.notes.option.day_level.is_mandatory = false;
  }  else if(value == 'mandatory'){
    this.request.rules.basic_rules.notes.option.day_level.is_allow = true;
    this.request.rules.basic_rules.notes.option.day_level.is_mandatory = true;
  }else {
    this.request.rules.basic_rules.notes.option.day_level.is_allow = false;
    this.request.rules.basic_rules.notes.option.day_level.is_mandatory = false;
  }
  }

  // get project notes value
  projectNotesSelected(value: any) {
    this.activitySelectedValue = value;
    if(value == 'optional'){
    this.request.rules.basic_rules.notes.option.project_level.is_allow = true;
    this.request.rules.basic_rules.notes.option.project_level.is_mandatory = false;
  }  else if(value == 'mandatory'){
    this.request.rules.basic_rules.notes.option.project_level.is_allow = true;
    this.request.rules.basic_rules.notes.option.project_level.is_mandatory = true;
  }else {
    this.request.rules.basic_rules.notes.option.project_level.is_allow = false;
    this.request.rules.basic_rules.notes.option.project_level.is_mandatory = false;
  }
  }

  // allow upload
  // allowUploads(value: any){
  //   this.allowUploadValue= value;
  //   if(value == 'optional'){
  //     this.request.rules.basic_rules.upload.is_mandatory = false;
  //   }else{
  //     this.request.rules.basic_rules.upload.is_mandatory = true;
  //   }
  // }

  // allow timesheet submitted
allowSubmitTimesheet(value: any) {
this.allowTimesheetSubmitted = value;
if(value =='anyDay') {
this.request.rules.basic_rules.is_enable_submit_eof_duration = false;
}else {
  this.request.rules.basic_rules.is_enable_submit_eof_duration = true;
}
  }

  // project toggle on/off
  projectToggle(value: any) {
    this.request.rules.basic_rules.project.is_allow = value
    if(!value){
      this.projectTypes = [];
      this.secondProjects=[];
      this.request.rules.basic_rules.project.option = [];
    }
  }
  
  // mdt toggle on/off
  mdtToggle(value: any) {
    this.request.rules.basic_rules.header.foundational_data.is_allow = value;
    if(!value){
      this.masterDataTypes = [];
      this.request.rules.basic_rules.header.foundational_data.value = [];
    }    
  }

  snakeCase = string => {
    string = string.toLowerCase();
    return string.replace(/\W+/g, ' ')
      .split(/ |\B(?=[A-Z])/)
      .map(word => word.toLowerCase())
      .join('_');
  }

  setDefaultsToFalse(){
    this.request.rules.basic_rules.past_period.is_allow= false;
    this.request.rules.basic_rules.past_period.option.msp.is_allow= false;
    this.request.rules.basic_rules.future_period.is_allow= false;
    this.request.rules.basic_rules.future_period.option.worker.is_allow= false;
    this.request.rules.basic_rules.past_period.option.vendor.is_allow= false;
    this.request.rules.basic_rules.past_period.option.worker.is_allow= false;
    this.request.rules.basic_rules.future_period.option.vendor.is_allow= false;
    this.request.rules.basic_rules.future_period.option.msp.is_allow= false;
    this.request.rules.basic_rules.grace_period.is_allow= false;
    // this.request.rules.basic_rules.grace_period.option.worker.is_allow= false;
    // this.request.rules.basic_rules.grace_period.option.vendor.is_allow= false;
    // this.request.rules.basic_rules.grace_period.option.msp.is_allow= false;
  }

  // save the timesheet
  saveAction() {
    this.setDefaultsToFalse();
    this.request.rules.basic_rules.timesheet_type = this.request?.rules?.basic_rules?.timesheet_type?.map(element => {
     return element?.toLowerCase();
   });
   if(!this.request.title){
     this.alertService.error("Please provide Timesheet configuration name");
     return;
   }
   if(!this.request.hierarchy_ids?.length){
     this.alertService.error("Please select hierarchy");
     return;
   }
  if(this.remoteWorkerLocation){
   if(!this.request?.location?.length && this.request.rules.basic_rules.workLocation){
    this.alertService.error("Please select Work Locations");
    return
  }
  if(!this.request?.rules?.basic_rules?.workLocation && !this.request?.rules?.basic_rules?.remoteWorkerLocation ){
    this.alertService.error("Please select Location Type");
    return
  }
    if(!this.request?.remote_country?.length && this.request.rules.basic_rules.remoteWorkerLocation){
      this.alertService.error("Please select Country");
      return
    }
  }
  else {
   if(!this.request?.location?.length){
    this.alertService.error("Please select Work Locations");
    return
  }
  }

   if(!this.request?.rules?.basic_rules?.work_week?.period){
     this.alertService.error("Please select Work Period");
     return
   }

   if(!this.request?.rules?.basic_rules?.copy_timesheet?.option?.period){
    this.alertService.error("Please enter copy timesheet value");
    return
  }
   if(this.request?.rules?.basic_rules?.work_week?.period.toLowerCase() == 'monthly' &&
   !this.request?.rules?.basic_rules?.work_week?.month_start_day){
    this.alertService.error("Please select Month start date");
     return
   }

   if(this.request?.rules?.basic_rules?.work_week?.period.toLowerCase() == 'weekly' &&
   !this.request?.rules?.basic_rules?.work_week?.week_start_day){
    this.alertService.error("Please select work start day");
     return
   }
   if(this.request?.rules?.basic_rules?.work_week?.period.toLowerCase() == 'x weekly' &&
   !this.request?.rules?.basic_rules?.work_week?.week_number){
    this.alertService.error("Please select work week number");
     return
   }
   if(!this.request.rules.basic_rules.timesheet_type?.length || this.request.rules.basic_rules.timesheet_type?.length == 0){
    this.alertService.error("Please select Timesheet type");
    return;
  }
  //  else {

  //    if(!this.request.rules.basic_rules.work_week.week_start_day){ //["weekly", "bi-Weekly", "x weekly"].includes(this.request?.rules?.basic_rules?.work_week?.period) &&
  //      this.alertService.error("Please select start of the week day");
  //      return;
  //    }
  //    if(["half month", "monthly"].includes(this.request?.rules?.basic_rules?.work_week?.period) && !this.request.rules.basic_rules.work_week.month_start_day){
  //      this.alertService.error("Please select Month start date");
  //      return;
  //    }
  //    if(this.request?.rules?.basic_rules?.work_week?.period?.toLowerCase() === 'x weekly' && !this.request.rules.basic_rules.work_week?.week_number){
  //      this.alertService.error("Please select week number");
  //      return;
  //    }
  //  }
   if(this.isHourly()){
     if(!this.request.rules.basic_rules.hour_type_calculation){
       this.alertService.error("Please select Hours Allocation");
       return;
     }
     if(!this.request.rules.basic_rules.hours_input_type.type){
       this.alertService.error("Please select Time Format");
       return;
     }
     if(!this.request.rules.basic_rules.hours_input_type.format && this.selectedHourAllocFormat=="decimal"){
       this.alertService.error("Please select Decimal Format");
       return;
     }
     if(!this.request.rules.basic_rules.hours_input_type.format && this.selectedHourAllocFormat=="hour"){
      this.alertService.error("Please select Hour Format");
      return;
    }
   }
   if(this.timeSheetTypeValue =='tito' && !this.titoTimeFormatValue){
    this.alertService.error("Please select Time Format");
       return;
   }
   if(this.request?.rules?.basic_rules?.project?.is_allow && this.secondProjects?.length == 0){
     this.alertService.error("Please select Project option");
     return;
   }
   if(this.request?.rules?.basic_rules?.header?.foundational_data?.is_allow && this.masterDataTypes?.length == 0){
     this.alertService.error("Please select a value for Master Data Type");
     return;
   }
   if(this.request.rules.basic_rules.working_days_in_week > 7){
     this.alertService.error("Please enter valid working days in week");
     return;
   }
  if(this.request.rules.basic_rules.max_regular_weekly_hours && this.request.rules.basic_rules.working_days_in_week && (this.request.rules.basic_rules.max_regular_weekly_hours > this.request.rules.basic_rules.working_days_in_week * 24)){
     this.alertService.error("Please enter valid Max no.of ST hours / Week");
     return;
   }
   if(this.request.rules.basic_rules.max_regular_daily_hours && this.request.rules.basic_rules.max_regular_daily_hours > 24){
     this.alertService.error("Please enter valid Max no. of ST Hours / Day");
     return;
   }
   if((this.request.rules.basic_rules.future_period.option.worker.period == null && this.request.rules.basic_rules.future_period.option.worker.type) ||
    (!this.request.rules.basic_rules.future_period.option.worker.type && this.request.rules.basic_rules.future_period.option.worker.period && this.request.rules.basic_rules.future_period.option.worker.period >=0)){
     this.alertService.error("Please enter valid worker future period access");
     return;
   }else if(this.request.rules.basic_rules.future_period.option.worker.type && this.request.rules.basic_rules.future_period.option.worker.period){
     this.request.rules.basic_rules.future_period.is_allow= true;
     this.request.rules.basic_rules.future_period.option.worker.is_allow= true;
   }

   if((this.request.rules.basic_rules.future_period.option.vendor.period == null && this.request.rules.basic_rules.future_period.option.vendor.type) ||
    (!this.request.rules.basic_rules.future_period.option.vendor.type && this.request.rules.basic_rules.future_period.option.vendor.period && this.request.rules.basic_rules.future_period.option.vendor.period >=0)){
     this.alertService.error("Please enter valid vendor future period access");
     return;
   }else if(this.request.rules.basic_rules.future_period.option.vendor.type && this.request.rules.basic_rules.future_period.option.vendor.period){
     this.request.rules.basic_rules.future_period.is_allow= true;
     this.request.rules.basic_rules.future_period.option.vendor.is_allow= true;
   }

   if((this.request.rules.basic_rules.future_period.option.msp.period == null && this.request.rules.basic_rules.future_period.option.msp.type) ||
    (!this.request.rules.basic_rules.future_period.option.msp.type && this.request.rules.basic_rules.future_period.option.msp.period && this.request.rules.basic_rules.future_period.option.msp.period >=0)){
     this.alertService.error("Please enter valid msp future period access");
     return;
   }else if(this.request.rules.basic_rules.future_period.option.msp.type && this.request.rules.basic_rules.future_period.option.msp.period){
     this.request.rules.basic_rules.future_period.is_allow= true;
     this.request.rules.basic_rules.future_period.option.msp.is_allow= true;
   }

   if((this.request?.rules?.basic_rules?.grace_period?.option?.worker?.period == null&& this.request?.rules?.basic_rules?.grace_period?.option?.worker?.type) ||
    (!this.request?.rules?.basic_rules?.grace_period?.option?.worker?.type && this.request?.rules?.basic_rules?.grace_period?.option?.worker?.period && this.request?.rules?.basic_rules?.grace_period?.option?.worker?.period >=0)){
     this.alertService.error("Please enter valid worker grace period access");
     return;
   }else if(this.request?.rules?.basic_rules?.grace_period?.option?.worker?.type && this.request?.rules?.basic_rules?.grace_period?.option?.worker?.period){
     this.request.rules.basic_rules.grace_period.is_allow= true;
     this.request.rules.basic_rules.grace_period.option.worker.is_allow= true;
   }

   if((this.request?.rules?.basic_rules?.grace_period?.option?.vendor?.period == null && this.request?.rules?.basic_rules?.grace_period?.option?.vendor?.type) ||
    (!this.request?.rules?.basic_rules?.grace_period?.option?.vendor?.type && this.request?.rules?.basic_rules?.grace_period?.option?.vendor?.period && this.request?.rules?.basic_rules?.grace_period?.option?.vendor?.period >=0)){
     this.alertService.error("Please enter valid vendor grace period access");
     return;
   }else if(this.request?.rules?.basic_rules?.grace_period?.option?.vendor?.type && this.request?.rules?.basic_rules?.grace_period?.option?.vendor?.period){
     this.request.rules.basic_rules.grace_period.is_allow= true;
     this.request.rules.basic_rules.grace_period.option.vendor.is_allow= true;
   }

   if((this.request?.rules?.basic_rules?.grace_period?.option?.msp?.period == null && this.request?.rules?.basic_rules?.grace_period?.option?.msp?.type) ||
    (!this.request?.rules?.basic_rules?.grace_period?.option?.msp?.type && this.request?.rules?.basic_rules?.grace_period?.option?.msp?.period && this.request?.rules?.basic_rules?.grace_period?.option?.msp?.period >=0)){
     this.alertService.error("Please enter valid msp grace period access");
     return;
   }else if(this.request?.rules?.basic_rules?.grace_period?.option?.msp?.type && this.request?.rules?.basic_rules?.grace_period?.option?.msp?.period){
     this.request.rules.basic_rules.grace_period.is_allow= true;
     this.request.rules.basic_rules.grace_period.option.msp.is_allow= true;
   }

   if((this.request.rules.basic_rules.past_period.option.worker.period == null && this.request.rules.basic_rules.past_period.option.worker.type) ||
    (!this.request.rules.basic_rules.past_period.option.worker.type && this.request.rules.basic_rules.past_period.option.worker.period && this.request.rules.basic_rules.past_period.option.worker.period >=0)){
     this.alertService.error("Please enter valid worker past period access");
     return;
   }else if(this.request.rules.basic_rules.past_period.option.worker.type && this.request.rules.basic_rules.past_period.option.worker.period){
     this.request.rules.basic_rules.past_period.is_allow= true;
     this.request.rules.basic_rules.past_period.option.worker.is_allow= true;
   }

   if((this.request.rules.basic_rules.past_period.option.vendor.period == null && this.request.rules.basic_rules.past_period.option.vendor.type) ||
    (!this.request.rules.basic_rules.past_period.option.vendor.type && this.request.rules.basic_rules.past_period.option.vendor.period && this.request.rules.basic_rules.past_period.option.vendor.period >=0)){
     this.alertService.error("Please enter valid vendor past period access");
     return;
   }else if(this.request?.rules?.basic_rules?.past_period?.option?.vendor?.type && this.request?.rules?.basic_rules?.past_period?.option?.vendor?.period){
     this.request.rules.basic_rules.past_period.is_allow= true;
     this.request.rules.basic_rules.past_period.option.vendor.is_allow= true;
   }

   if((this.request?.rules?.basic_rules?.past_period?.option?.msp?.period == null && this.request?.rules?.basic_rules?.past_period?.option?.msp?.type) ||
    (!this.request?.rules?.basic_rules?.past_period?.option?.msp?.type && this.request?.rules?.basic_rules?.past_period?.option?.msp?.period && this.request?.rules?.basic_rules?.past_period?.option?.msp?.period >=0)){
     this.alertService.error("Please enter valid msp past period access");
     return;
   }else if(this.request?.rules?.basic_rules?.past_period?.option?.msp?.type && this.request?.rules?.basic_rules?.past_period?.option?.msp?.period){
     this.request.rules.basic_rules.past_period.is_allow= true;
     this.request.rules.basic_rules.past_period.option.msp.is_allow= true;
   }
  if(this.request?.rules?.basic_rules?.work_week?.period?.toLowerCase() =="weekly" &&
  this.request?.rules?.basic_rules?.past_period?.option.worker?.type!=="week"){
    this.alertService.error("The Worker gets access to e?nter the Passed Unfilled Timesheet(s) must select week");
    return;
  }else if(this.request.rules.basic_rules.work_week.period?.toLowerCase() =="weekly" &&
  this.request.rules.basic_rules.past_period.option.vendor.type!=="week"){
    this.alertService.error("The Vendor gets access to enter the Passed Unfilled Timesheet(s) must select week");
    return;
  }else if(this.request.rules.basic_rules.work_week.period?.toLowerCase() =="weekly" &&
  this.request.rules.basic_rules.past_period.option.msp.type!=="week"){
      this.alertService.error("The MSP gets access to enter the Passed Unfilled Timesheet(s) must select week");
      return;
  }else if(this.request.rules.basic_rules.work_week.period?.toLowerCase() =="weekly" &&
  this.request.rules.basic_rules.future_period.option.worker.type!=="week"){
    this.alertService.error("The Worker gets access to enter future Timesheet ahead of the current Timesheet period must select week");
    return;
  }else if(this.request.rules.basic_rules.work_week.period?.toLowerCase() =="weekly" &&
  this.request.rules.basic_rules.future_period.option.vendor.type !== "week"){
    this.alertService.error("The Vendor gets access to enter future Timesheet ahead of the current Timesheet period must select week");
    return;
  }else if(this.request.rules.basic_rules.work_week.period?.toLowerCase() =="weekly" &&
  this.request.rules.basic_rules.future_period.option.msp.type !== "week"){
    this.alertService.error("The MSP gets access to enter future Timesheet ahead of the current Timesheet period must select week");
    return;
  }

  if(this.request.rules.basic_rules.work_week.period?.toLowerCase() =="monthly" &&
  this.request.rules.basic_rules.past_period.option.worker.type!=="month"){
    this.alertService.error("The Worker gets access to enter the Passed Unfilled Timesheet(s) must select month");
    return;
  }else if(this.request.rules.basic_rules.work_week.period?.toLowerCase() =="monthly" &&
  this.request.rules.basic_rules.past_period.option.vendor.type!=="month"){
    this.alertService.error("The Vendor gets access to enter the Passed Unfilled Timesheet(s) must select month");
    return;
  }else if(this.request.rules.basic_rules.work_week.period?.toLowerCase() =="monthly" &&
  this.request.rules.basic_rules.past_period.option.msp.type!=="month"){
      this.alertService.error("The MSP gets access to enter the Passed Unfilled Timesheet(s) must select month");
      return;
  }else if(this.request.rules.basic_rules.work_week.period?.toLowerCase() =="monthly" &&
  this.request.rules.basic_rules.future_period.option.worker.type!=="month"){
    this.alertService.error("The Worker gets access to enter future Timesheet ahead of the current Timesheet period must select month");
    return;
  }else if(this.request.rules.basic_rules.work_week.period?.toLowerCase() =="monthly" &&
  this.request.rules.basic_rules.future_period.option.vendor.type !== "month"){
    this.alertService.error("The Vendor gets access to enter future Timesheet ahead of the current Timesheet period must select month");
    return;
  }else if(this.request.rules.basic_rules.work_week.period?.toLowerCase() =="monthly" &&
  this.request.rules.basic_rules.future_period.option.msp.type !== "month"){
    this.alertService.error("The MSP gets access to enter future Timesheet ahead of the current Timesheet period must select month");
    return;
  }
if(this.request?.rules?.basic_rules?.break?.options?.filter(n => n?.type).length == 0){
  this.request.rules.basic_rules.break.options = []
}else{
  this.request.rules.basic_rules.break.options = this.request?.rules?.basic_rules?.break?.options?.filter(n => n?.type)
}
if(!!this.remoteWorkerLocation){
  this.request.location_type = [];
  if(this.request?.rules?.basic_rules?.remoteWorkerLocation) {
    this.request.location_type.push("remote")
  }
  if(this.request?.rules?.basic_rules?.workLocation) {
    this.request.location_type.push("work")
  }
}
else {
  this.request.location_type.push("work")
}

  let name = this.request.hierarchy_ids.map(n => n?.name)
  if(name[0]) {
   this.request['hierarchy_ids'] = this.request.hierarchy_ids.map(n => n?.id)

  }
  // if(!this.currentprogram?.config?.bulk_timesheet_approval){
  //   this.request.rules.basic_rules.is_allow_mass_approval = false
  // }else{
  //  this.request.rules.basic_rules.is_allow_mass_approval = this.currentprogram?.config?.bulk_timesheet_approval
  // }
   this.saveInprogress = true;
   this.currentprogram= this.storageService.get(StorageKeys.CURRENT_PROGRAM);
   let url = `/timesheet/programs/${this.currentprogram?.id}/config/basic`;
   let methodType= 'post';
   if(this.mode === this.configurationMode.Edit && this.configId){
     url += `/${this.configId}/edit`;
     methodType= 'put';
   }
   if(this.secondProjects?.length > 0 && this.request.rules.basic_rules.project.option){
    this.request.rules.basic_rules.project.option = [];
     this.secondProjectsDropdown.forEach(dropdown => {
       if(this.secondProjects.includes(dropdown.name)){
        if(this.request?.rules?.basic_rules?.hour_type_calculation === "hybrid") {
         let secondProjectDropdown = { ...dropdown };
         delete secondProjectDropdown['name'];
         this.request.rules.basic_rules.project.option.push(secondProjectDropdown);
        }
        else {
          this.request.rules.basic_rules.project.option.push(dropdown);
        }
       }
     });
   }
   if(this.masterDataTypes?.length > 0 && this.request?.rules?.basic_rules?.header?.foundational_data?.value){
    this.request.rules.basic_rules.header.foundational_data.value = [];
     this.masterDataTypes.forEach(dropdown => {
         this.request?.rules?.basic_rules?.header?.foundational_data?.value.push(dropdown);
     });
   }

   const basic_rules = this.request.rules.basic_rules;
   if(basic_rules && !basic_rules.time_format && !this.isDayTimesheet() && this.isCico()) {
     this.alertService.error('Please select the time format');
     this.saveInprogress = false;
     return;
   }
   let payload;
   if(!this.isCico()) {
     this.request.rules.basic_rules.time_format = null;
   }
   // day_type
   if(this.isDayTimesheet) {
     this.request.rules.basic_rules.day_input_type = this.getDayTypes();
   }
   if(this.isDayTimesheet) {
     this.request.rules.basic_rules.day_input_type = this.getDayTypes();
   }
   // end
   const status = this.request['status'];
   if(status && (typeof status === 'string')) {
     this.request.status = (status.toLowerCase() === 'active')?true:false;
   }
    this.logs = undefined;
     this.request.start_date = this.datePipe.transform(this.request.start_date, DATE_FORMAT?.FORMATYMD ,null ,null , true, this.dateFormat)
     if (this.request?.location?.includes('')) {
      payload = { ...this.request, location: [] };
    } else {
      payload = this.request;
    }
    payload = JSON.parse(JSON.stringify(payload));
    delete payload?.rules?.basic_rules?.remoteWorkerLocation;
    delete payload?.rules?.basic_rules?.workLocation;
    delete payload?.start_date;
     this.timeSheetConfigService[methodType](url, payload).subscribe((data: any) => {
     this.saveInprogress = false;
     this.alertService.success("Timesheet Configuration Saved Successfully.");
     this.backLink();
   }, (error) => {
     this.saveInprogress = false;
     if(error?.error?.error?.errors && error?.error?.error?.errors[0] && error?.error?.error?.errors[0].message){
      // this.alertService.error(error?.error?.error?.errors[0].message);
       this.showError(error);
     } else {
       this.alertService.error('Error While Saving Timesheet Configuration.');
     }
   });

 }
 backLink() {
  this.route.navigate(['configuration', 'timesheet', 'list']);
}

showError(err) {
  window.scrollTo(0, 0);
  this.logs = {
    type: LOG_TYPE.ERROR, heading: err?.error?.error?.message, messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo: { trace_id: err?.error?.trace_id }
  };
  err?.error?.error?.errors?.forEach(msg => {
    if (msg?.message) {
      this.logs.messages.push(msg?.message);

    }
  });
}

validateDays(value : any){
  this.request.rules.basic_rules.working_days_in_week = Number(value)
  if(this.request.rules.basic_rules.working_days_in_week == 7){
    this.request.rules.basic_rules.weekend.option= [];
    this.request.rules.basic_rules.weekend.is_allow_entry= false;
  }
}
  validateStHours(value: any) {
    this.request.rules.basic_rules.max_regular_weekly_hours = Number(value);
  }

  validateNumberStHours(value: any) {
    this.request.rules.basic_rules.max_regular_daily_hours = Number(value);
  }
  onDailyHourChange(value: any) {
    this.request.rules.basic_rules.allowed_maximum_daily_hours = Number(value);
  }

  onDailyWeeklyChange(value: any) {
    this.request.rules.basic_rules.allowed_maximum_weekly_hours = Number(value);
  }

  onToggleDailyHourLimit(value: any) {
    if (!value) {
      this.request.rules.basic_rules.allowed_maximum_daily_hours = 0;
    }
    this.request.rules.basic_rules.is_enable_daily_hour_limit = value;
  }

  onToggleWeeklyHourLimit(value: any) {
    if (!value) {
      this.request.rules.basic_rules.allowed_maximum_weekly_hours = 0;
    }
    this.request.rules.basic_rules.is_enable_weekly_hour_limit = value;
  }
  onDisableRuleValidate() {
    this.request.rules.basic_rules.disable_validate_rule = !this.request.rules.basic_rules.disable_validate_rule;
  }

// select weekend
selectWeekend(value: any) {
  this.request.rules.basic_rules.weekend.option = value;
}

// toggle weekend/week off
weekendWeekOffToggle(value: any) {
  this.request.rules.basic_rules.weekend.is_allow_entry = value
}
// toggle paid weekend/week off
paidWeekendWeekOffToggle(value: any) {
  this.request.rules.basic_rules.weekend.is_paid = value
}

//select break type
selectBreakType(value: any) {
  this.request = value

  // this.request.rules.basic_rules.break.options.type = value;
}

// paid break checkbox
paidBreaks(value: any) {
  // this.request.rules.basic_rules.break.options.is_paid_inclusive = value;
}
// paid break mandatory/not
paidMandatorys(value: any) {
  // this.request.rules.basic_rules.break.options.is_mandatory = value;
}

//max paid hour
maxPaidHour(value: any){
  this.request = value
  // this.request.rules.basic_rules.break.break_rule.min_hours = Number(value);
}

//min paid hour
minPaidHour(value:any){
  // this.request.rules.basic_rules.break.break_rule.max_hours = Number(value);
}
toggleValue(value:any) {
  this.request = value;
}

//allow vendor to perform modification
allowVendowTofPerModifn(value: any) {
  this.request.rules.basic_rules.hours_modification_period.option.vendor.period = value;
}

//allow msp to perform modification
allowMSPToPerModifn(value: any) {
this.request.rules.basic_rules.hours_modification_period.option.msp.period = value;
}
//allow vendor to perform modification dropdown value
getSelectedValue(value: any) {
  this.request.rules.basic_rules.hours_modification_period.option.vendor.type =value
}
// allow MSP to perform modification dropdown value
getSelectedMSPValue(value: any) {
this.request.rules.basic_rules.hours_modification_period.option.msp.type = value
}
// Vendor Modification after
onValueChangeonValueChange(value: any){
this.request.rules.basic_rules.hours_modification_period.option.vendor.applicable_on = value
}

// MSP Modification after
onValueChangeonMSPValueChange(value: any) {
  this.request.rules.basic_rules.hours_modification_period.option.msp.applicable_on = value;
}

//Allow worker access to enter time ahead of current timesheet period text value
allowWorkerTimesheetEntries(value:any){
  this.request.rules.basic_rules.future_period.option.worker.period = value;
}
//Allow worker access to enter time ahead of current timesheet period dropdown value
allowWorkerTimesheetEntriesDropdown(value: any) {
  this.request.rules.basic_rules.future_period.option.worker.type = value;
}

//Allow vendor access to enter time ahead of the current timesheet period text value
allowVendorTimesheetEntries(value:any) {
this.request.rules.basic_rules.future_period.option.vendor.period = value;
}

//Allow vendor access to enter time ahead of the current timesheet period dropdown value
allowVendorTimesheetEntriesDropdown(value:any){
this.request.rules.basic_rules.future_period.option.vendor.type = value;
}

//Allow MSP access to enter time ahead of the current timesheet period text value
allowMSPTimesheetEntries(value:any) {
this.request.rules.basic_rules.future_period.option.msp.period = value;
}

//Allow MSP access to enter time ahead of the current timesheet period dropdown value
allowMSPTimesheetEntriesDropdown(value:any) {
  this.request.rules.basic_rules.future_period.option.msp.type = value;
}

//Allow worker access to enter time after assignment End Date text value
allowWorkerEndDateTimesheetEntries(value:any) {
this.request.rules.basic_rules.grace_period.option.worker.period = value;
}

//Allow worker access to enter time after assignment End Date dropdown value
allowWorkerEndDateTimesheetEntriesDropdown(value:any) {
  this.request.rules.basic_rules.grace_period.option.worker.type= value;
}

//Allow vendor access to enter time after assignment End Date text value
allowVendorEndDateTimesheetEntries(value: any) {
  this.request.rules.basic_rules.grace_period.option.vendor.period = value;
}

//Allow vendor access to enter time after assignment End Date dropdown value
allowVendorEndDateTimesheetEntriesDropdown(value: any){
this.request.rules.basic_rules.grace_period.option.vendor.type= value;
}

//Allow MSP access to enter time after assignment End Date text value
allowMSPEndDateTimesheetEntries(value: any){
this.request.rules.basic_rules.grace_period.option.msp.period= value;
}

//Allow MSP access to enter time after assignment End Date dropdown value
allowMSPEndDateTimesheetEntriesDropdown(value:any){
this.request.rules.basic_rules.grace_period.option.msp.type = value;
}

//Allow worker to Enter Password Unfilled Timesheet text value
allowWorkerUnfilledTimesheetEntries(value:any){
  this.request.rules.basic_rules.past_period.option.worker.period = value;
}

//Allow worker to Enter Password Unfilled Timesheet dropdown value
allowWorkerUnfilledTimesheetEntriesDropdown(value:any){
  this.request.rules.basic_rules.past_period.option.worker.type = value;
}

//Allow vendor to Enter Password Unfilled Timesheet text value
allowVendorUnfilledTimesheetEntries(value:any){
this.request.rules.basic_rules.past_period.option.vendor.period = value;
}

//Allow vendor to Enter Password Unfilled Timesheet dropdown value
allowVendorUnfilledTimesheetEntriesDropdown(value:any) {
this.request.rules.basic_rules.past_period.option.vendor.type = value;
}

//Allow MSP to Enter Password Unfilled Timesheet text value
allowMSPUnfilledTimesheetEntries(value:any){
this.request.rules.basic_rules.past_period.option.msp.period = value;
}

//Allow MSP to Enter Password Unfilled Timesheet dropdown value
allowMSPUnfilledTimesheetEntriesDropdown(value:any) {
this.request.rules.basic_rules.past_period.option.msp.type = value;
}

//copy timesheet range
copyTimesheetRange(value: any) {
  this.request.rules.basic_rules.copy_timesheet.option.type = value;
}

//Allowed Number of Previous Weeks
allowedPreviousWeek(value: any){
  this.request.rules.basic_rules.copy_timesheet.option.period = value;
}

//mass Approval
// massApproval(value:any) {
//   this.currentprogram.config.bulk_timesheet_approval = value;
// }

//Allow a day cross-over (overnight)
crossOver(value: any) {
  this.request.rules.basic_rules.overnight = value
}

//Soft Delete Timesheet
softDeleteTimesheet(value: any) {
  this.request.rules.basic_rules.soft_delete.option= value;
}

// allow uploadselect type
// allowUploadSelectType(value:any) {
//   this.uploadLevel =value
//   this.options.uploadLevels.forEach(level => {
//     this.request.rules.basic_rules.upload.option[level.value].is_allow = false
//   });

//   this.request.rules.basic_rules.upload.option[value].is_allow = true;
// }

// seect timesheet format
selectFormatValue(value: any){
  this.selectedHourAllocFormat = value;
}

// tito time format
titoTimeFormat(value:any) {
this.titoTimeFormatValue = value;
}

// select timesheet type
selectedTimeSheet(value: any){
  value === "cico"? this.isBreakTiming = true: this.isBreakTiming = false;
  this.resetTimesheetTypesProperty();
  this.timeSheetTypeValue = value;
}

resetTimesheetTypesProperty() {
  this.projectTypes = [];
  this.secondProjects = [];
  this.request.rules.basic_rules.project.is_allow = false;
  this.request.rules.basic_rules.hours_input_type.format = null;
  this.request.rules.basic_rules.hour_type_calculation = null;
  this.request.rules.basic_rules.hours_input_type.type = null;
  this.request.rules.basic_rules.time_format = null;
}

// select all in work location
allWorkLocation(value: any) {
  if(value.includes('')){
    this.request.location = ['']
  }
}

workStartDay() {
  this.request.rules.basic_rules.work_week.week_number = '';
  this.request.rules.basic_rules.work_week.month_start_day = '';
}

workWeekNumber() {
 this.request.rules.basic_rules.work_week.month_start_day = '';
 this.request.rules.basic_rules.work_week.week_start_day = '';
}
monthStartDay() {
  this.request.rules.basic_rules.work_week.week_number = '';
  this.request.rules.basic_rules.work_week.week_start_day = '';
}


onWorklocationClick(evt){
  setTimeout(()=>{
    if(!this.request?.rules?.basic_rules?.workLocation) {
      this.request.location = [];
    }
  },0)

}
onRemoteWorkerlocationClick(evt){
  setTimeout(()=>{
    if(!this.request?.rules?.basic_rules?.remoteWorkerLocation) {
      this.request.remote_country = [];
      this.request.remote_state = [];
      this.request.remote_county = [];
      this.request.remote_city = [];
    }
  },0)

}
allFieldsFilled() {
let project = false;
let timesheetHeader = false;
let dailyTimesheet  = false;
let timeformat = false;
if((this.request?.rules?.basic_rules?.project?.is_allow && this.secondProjects.length !==0) || (!this.request?.rules?.basic_rules?.project?.is_allow)){
  project= true
}
if((this.request?.rules?.basic_rules?.header?.foundational_data?.is_allow && this.masterDataTypes.length !==0) || (!this.request?.rules?.basic_rules?.header?.foundational_data?.is_allow)){
  timesheetHeader = true;
}
if(this.request?.rules?.basic_rules?.timesheet_type[0] == 'days'){
  dailyTimesheet = true;
  timeformat = true;
}else if(((this.isHourly()) && ((this.request?.rules?.basic_rules?.hours_input_type?.type)) && ((this.request?.rules?.basic_rules?.hours_input_type?.format))) || (this.request?.rules?.basic_rules?.timesheet_type[0] == 'cico')){
  timeformat = true;
}
  return (
    (this.request?.title)&&
    (this.request['hierarchy_ids']) &&
    ((this.request?.location?.length && !this.remoteWorkerLocation) ||
    ((this.request?.rules?.basic_rules?.workLocation || this.request?.rules?.basic_rules?.remoteWorkerLocation) &&
    (this.request?.rules?.basic_rules?.workLocation ? this.request?.location?.length : true) &&
    (this.request?.rules?.basic_rules?.remoteWorkerLocation ? this.request?.remote_country?.length : true) && this.remoteWorkerLocation)) &&
    (this.request?.start_date) &&
    (this.request?.rules?.basic_rules?.work_week?.period) &&
    (this.request?.rules?.basic_rules?.work_week?.week_start_day || this.request?.rules?.basic_rules?.work_week?.month_start_day)&&
    (this.request?.rules?.basic_rules?.timesheet_type) &&
    (this.request?.rules?.basic_rules?.time_format || this.request?.rules?.basic_rules?.hour_type_calculation || dailyTimesheet) &&
    (project) &&
    (timesheetHeader) && 
    (timeformat)
  );
}

  updatePeriod(event, type) {
    setTimeout(() => {
      this.request.rules.basic_rules[type].option = this.convertPeriod(event,type);
    }, 10);
  }

  convertPeriod(data, type) {
    const convertedData = {};
    this.isValidData = this.request?.rules?.basic_rules[type]?.is_allow && data?.length === 0;
    data?.forEach(item => {
      const { userType, period, type: itemType } = item || {};
      const isValidItem = !userType || !period || !itemType;
      this.isValidData = this.request?.rules?.basic_rules[type]?.is_allow && isValidItem;
      convertedData[userType?.toLowerCase()] = {
        is_allow: period && itemType,
        period,
        type: itemType?.toLowerCase() || null
      };
    });
    return convertedData;
  }
}
