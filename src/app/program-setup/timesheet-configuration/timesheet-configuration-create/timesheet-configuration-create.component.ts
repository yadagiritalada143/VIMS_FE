import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { LOG_TYPE, Log } from 'src/app/library/logs/logs.model';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { TimesheetType } from 'src/app/wipro-timesheet/timesheet.enums';
import { ConfigurationMode } from '../../expense-configuration/enums/configuration-mode.enums';
import { TimesheetConfigurationService } from '../timesheet-configuration.service';
@Component({
  selector: 'app-timesheet-configuration-create',
  templateUrl: './timesheet-configuration-create.component.html',
  styleUrls: ['./timesheet-configuration-create.component.scss']
})
export class TimesheetConfigurationCreateComponent implements OnInit {
  public locations: Array<Object> = [];
  private pageNo = 0;
  createTimesheetConfigForm: UntypedFormGroup;
  public readonly configurationMode = ConfigurationMode;
  calendarOptions: any = {
    language: 'English',
    range: false,
    enabledDateRanges: [
      { start: Date.now() },
    ]
  };
  dateFormat:string = DATE_FORMAT.FORMATDDMMYY;
  public trueValue = true;
  public request: any = {};
  hierarchyVisibility:string= 'hidden';
  isHierarchySelected:boolean= false;
  public options: any = {};
  public hierarchies:any = null;
  userAssociateHierarchy: string[] = [];
  defaultHierarchy: string[] = [];
  public uploadLevel = null;
  public saveInprogress = false;
  public breakOperator:any={min:'>', max: '<'};
  public customFields:any=[];
  public foundationalFields:any=[];
  public customProjects:any=[];
  public secondProjectsDropdown:any=[];
  public secondProjects:any=[];
  public thirdProjectsDropdown:any=[];
  public thirdProjects:any=[];
  public projectTypes:any=[];
  public selectedTimesheet:any=[];
  history: Array <any> = [];
  currentprogram: any = undefined;
  public selections: Array<string> = [];
  public defaultSelections: Array<string> = [];
  logs: Log = undefined;
  workLocation = new Subject<string>();
  dayType = [
    { value: 0.25, name: 'Quarter Day', checked: true },
    { value: 0.50, name: 'Half Day', checked: true },
    { value: 0.75, name: '3 Quarter Day', checked: true },
    { value: 1, name: 'Day', checked: true }
  ];
  constructor(
    private route: SvmsRouterService,
    private activatedRoute: ActivatedRoute,
    private storageService: StorageService,
    private alertService: AlertService,
    private localDatePipe: LocalDateFormatPipe,
    private timeSheetConfigService: TimesheetConfigurationService,
  ) {
    this.workLocation.pipe(debounceTime(300), distinctUntilChanged()).subscribe((value: any) => {
      this.getWorkLocations(value?.term, true);
    });

  }

  getCustomFields() {
    this.currentprogram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let url = `/configurator/programs/${this.currentprogram?.id}/custom-fields?entity_ref=timesheets&limit=50`;
    this.timeSheetConfigService.get(url).subscribe({
      next: (data: any) => {
        if (data && data.custom_fields.length > 0) {
          this.customFields = data.custom_fields.map((cd: any) => {
            cd.parent_type = 'custom_data';
            return cd;
          });
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
    const url = `/configurator/programs/${this.currentprogram?.id}/rate-factors?limit=50&page=1`;
    //`/configurator/programs/${this.programDetails.id}/picklists/*/items?picklist_slug=custom_project`;
    this.timeSheetConfigService
    .get(url)
    .subscribe((response: any) => {
      if(response?.rate_factors) {
        this.customProjects =  response?.rate_factors?.map(cp => {
          let customProject={
            parent_type: 'project-x',
            title:  cp.name,
            rate_factor: cp.abbreviation,
            rate_type: "regular",
            id: cp.id,
            value: cp.id,
            name: cp.name,
            abbreviation: cp.abbreviation
          };
          /* cp.combo=[];
           cp.isCombined= true;
          this.options?.projectXPredefinedValues?.forEach(project => {
            cp.combo.push({parent_type: project.parent_type, ...cp, name: cp.value+' - '+project.name, custom_project: cp.value, mappedName: project.name})
          });  */
          return customProject;
        });
      }
    });
  }

  CreateNewPickListItem = (name) =>{
    this.secondProjectsDropdown.push({name: name, parent_type: "project-x", value: name});
    return name;
  }

  getFoundationalTypes() {
    this.currentprogram= this.storageService.get(StorageKeys.CURRENT_PROGRAM);
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
  getTimesheetType() {
    this.currentprogram= this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    // &hierarchy_id=${hierarchy_id}
    let url = `/configurator/programs/${this.currentprogram?.id}/pick-lists/*/items?picklist_slug=timesheet_type&is_enabled=true`;
    this.timeSheetConfigService.get(url).subscribe((data: any) => {
      if (data && data?.picklist_items) {
        this.selectedTimesheet = data?.picklist_items;
      }
    })
  }

  snakeCase = string => {
    string = string.toLowerCase();
    return string.replace(/\W+/g, ' ')
      .split(/ |\B(?=[A-Z])/)
      .map(word => word.toLowerCase())
      .join('_');
  }

  isWeekly() {
    return this.request?.rules?.basic_rules?.work_week?.period?.toLowerCase() === 'weekly' ||
      this.request?.rules?.basic_rules?.work_week?.period?.toLowerCase() === 'bi-weekly' ||
      this.request?.rules?.basic_rules?.work_week?.period?.toLowerCase() === 'x weekly';
  }

  isHourly() {
    return Array.isArray(this.request?.rules?.basic_rules?.timesheet_type) && this.request?.rules?.basic_rules?.timesheet_type?.includes('hours');
  }

  isCico() {
    return Array.isArray(this.request?.rules?.basic_rules?.timesheet_type) && this.request?.rules?.basic_rules?.timesheet_type?.includes('cico');
  }

  isConfigTabActive:boolean = true;
  isHistoryTabActive:boolean = false;
  public toggle = {
    title: 'Active', // Manual Timesheet
    value: true
  };
  public toggleBreak = {
    title: 'Active',
    value: true
  };

  public toggleProjectStatus = {
    title: 'Active',
    value: true
  };

  public toggleNotes = {
    title: 'Active',
    value: true
  };

  public toggleUpload = {
    title: 'Active',
    value: true
  };

  public toggleCopyTimesheet = {
    title: 'Active',
    value: true
  };

  public toggleMassApproval = {
    title: 'Active',
    value: true
  };

  public toggleCrossOver = {
    title: 'Active',
    value: true
  };

  public toggleModification = {
    title: 'Active',
    value: true
  };

  public toggleDelete = {
    title: 'Active',
    value: true
  };

  public toggleManual = {
    title: 'Active',
    value: true
  };

  public mode:string= undefined;
  public configId:string= undefined;
  projectModal = false;

  ngOnInit(): void {
    this.getWorkLocations(undefined, true);
    this.createForm();
    this.loadForm();
    this.getHierarchy();
    this.getCustomFields();
    this.getFoundationalTypes();
    this.getRateFactors();
    this.getTimesheetType();
    setTimeout(() => {
    this.activatedRoute.queryParams
    .subscribe(params => {
      this.mode = params['mode'];
      this.configId= params['id'];
      if(this.mode && this.configId){
        this.loadTimesheetConfiguration();
        this.loadTSConfigurationHistory();
      }
    });
  },800)
    // this.getRateFactors();
  }

  backLink() {
    this.route.navigate(['timesheet', 'config', 'list']);
  }

  showConfig() {
    this.isConfigTabActive = true;
    this.isHistoryTabActive = false;
  }

  showHistory() {
    this.isConfigTabActive = false;
    this.isHistoryTabActive = true;
  }

  onClickToggleProject() {
    if (this.toggleProjectStatus.value) {
      this.toggleProjectStatus.value = false;
      this.toggleProjectStatus.title = 'inactive';
    } else {
      this.toggleProjectStatus.value = true;
      this.toggleProjectStatus.title = 'active';
    }
  }

  onClickToggleNotes() {
    if (this.toggleNotes.value) {
      this.toggleNotes.value = false;
      this.toggleNotes.title = 'inactive';
    } else {
      this.toggleNotes.value = true;
      this.toggleNotes.title = 'active';
    }
  }

  onClickToggleUpload() {
    if (this.toggleUpload.value) {
      this.toggleUpload.value = false;
      this.toggleUpload.title = 'inactive';
    } else {
      this.toggleUpload.value = true;
      this.toggleUpload.title = 'active';
    }
  }

  onClickToggle() {
    if (this.toggle.value) {
      this.toggle.value = false;
      this.toggle.title = 'inactive';
    } else {
      this.toggle.value = true;
      this.toggle.title = 'active';
    }
  }

  onClickToggleBreak() {
    if (this.toggleBreak.value) {
      this.toggleBreak.value = false;
      this.toggleBreak.title = 'Inactive';
    } else {
      this.toggleBreak.value = true;
      this.toggleBreak.title = 'Active';
    }
  }

  onClickToggleCopyTimesheet() {
    if (this.toggleCopyTimesheet.value) {
      this.toggleCopyTimesheet.value = false;
      this.toggleCopyTimesheet.title = 'Inactive';
    } else {
      this.toggleCopyTimesheet.value = true;
      this.toggleCopyTimesheet.title = 'Active';
    }
  }

  onClickToggleMassApproval() {
    if (this.toggleMassApproval.value) {
      this.toggleMassApproval.value = false;
      this.toggleMassApproval.title = 'Inactive';
    } else {
      this.toggleMassApproval.value = true;
      this.toggleMassApproval.title = 'Active';
    }
  }

  onClickToggleCrossOver() {
    if (this.toggleCrossOver.value) {
      this.toggleCrossOver.value = false;
      this.toggleCrossOver.title = 'Inactive';
    } else {
      this.toggleCrossOver.value = true;
      this.toggleCrossOver.title = 'Active';
    }
  }

  onClickToggleModification() {
    if (this.toggleModification.value) {
      this.request.rules.basic_rules.hours_modification_period.is_allow= false;
      this.toggleModification.value = false;
      this.toggleModification.title = 'Inactive';
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
      this.request.rules.basic_rules.hours_modification_period.is_allow= true;
      this.toggleModification.value = true;
      this.toggleModification.title = 'Active';
    }
  }

  onClickToggleDelete() {
    if (this.toggleDelete.value) {
      this.toggleDelete.value = false;
      this.toggleDelete.title = 'Inactive';
    } else {
      this.toggleDelete.value = true;
      this.toggleDelete.title = 'Active';
    }
  }

  onClickToggleManual() {
    if (this.toggleManual.value) {
      this.toggleManual.value = false;
      this.toggleManual.title = 'Inactive';
    } else {
      this.toggleManual.value = true;
      this.toggleManual.title = 'Active';
    }
  }



  loadForm() {
    this.currentprogram= this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.dateFormat = this.currentprogram?.defaultDateFormat?.toUpperCase();
    const str1 = this.localDatePipe.transform(this.currentprogram?.start_date, this.dateFormat ,null ,null , true, DATE_FORMAT?.FORMATYMD);
    if(str1){
      this.request.start_date = str1;
      let startdate = this.currentprogram?.start_date?.includes('-') ? this.currentprogram?.start_date?.split("-") : this.currentprogram?.start_date?.split("/");
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


  getHierarchy() {
    const logUser = this.storageService.get(StorageKeys.CURRENT_USER);
    this.currentprogram= this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let url = '/configurator/programs/' + this.currentprogram?.id + '/hierarchy?user_id=' + logUser?.id

    this.timeSheetConfigService.get(url)
    .subscribe((data: any) => {
      // this.hierarchies = [];
      if(data?.result?.length > 0) {
        this.hierarchies = data?.result;
        this.defaultHierarchy = [data.result[0].hierarchies[0].id];
        this.userAssociateHierarchy = [data.result[0].hierarchies[0].id];
      }
      // this.addHierarchy(data.result[0]);
    });
  }


  hierarchySelectionChanged(event: Array<string>) {
      this.selections = event;
    if (this.selections.length && !this.defaultSelections.length) {
      this.defaultSelections = [this.selections[0]];
    }
    if(event && event.length > 0) {
      this.changeHierarchy(event, this.hierarchies);
      this.isHierarchySelected = true;
    } else {
      this.isHierarchySelected = false;
    }
  }
  selectedHierarchy(e) {

  }

  // changeHierarchy(id, hierarchyData) {
  //   this.request['hierarchy_ids'] = id
  //   let isPresent = false;
  //   // this.request.rules.basic_rules.timesheet_type = []
  //   const selectedHierarchy = hierarchyData?.filter(data => {
  //     if (data.id === id[0]) {
  //       isPresent = true;
  //       this.request.hierarchy_id = data.id;
  //       this.request.hierarchy= data;
  //       return data;
  //     } else {
  //       if (data.hierarchies && data.hierarchies.length > 0) {
  //         data.hierarchies.forEach(element => {
  //             if (element.id === id[0]) {
  //               this.request.hierarchy_id = element.id;
  //               this.request.hierarchy= element;
  //               this.selectedTimesheet = element.pick_list_items ? element.pick_list_items : []
  //               // this.basicJobInfo.selectedHierarchy = element;
  //               return element;
  //               // }
  //             } else {
  //               // this.createJobObject.hierarchyData.push({ name: element?.name, id: element?.id })
  //               this.changeHierarchy(id, data.hierarchies);

  //             }
  //         });
  //       }
  //     }
  //   });

  // }
  changeHierarchy(id, hierarchyData) {
    // this.selectedTimesheet = [];
    // let isPresent = false;
    // this.request.rules.basic_rules.timesheet_type = []
    // let hierarcyName = [];
  // id?.forEach(ids => {
  //   if(hierarchyData[0]?.hierarchies[0]?.hierarchies.length > 0){
  //   hierarchyData[0]?.hierarchies[0]?.hierarchies?.forEach(hierarchie => {
  //     hierarchie?.pick_list_items?.forEach(pickListItem => {
  //       if(hierarchie?.id == ids && this.selectedTimesheet?.filter(n => n?.id ==pickListItem?.id).length ==0){
  //         this.selectedTimesheet.push(pickListItem)
  //       }
  //     })
  //   })}else {
  //     hierarchyData[0]?.hierarchies?.forEach(hierarchie => {
  //       hierarchie?.pick_list_items?.forEach(pickListItem => {
  //         if(hierarchie?.id == ids && this.selectedTimesheet?.filter(n => n?.id ==pickListItem?.id).length ==0){
  //           this.selectedTimesheet.push(pickListItem)
  //         }
  //       })
  //     })
  //   }
  // })
  // if(this.selectedTimesheet?.filter(n => n.value == this.request?.rules?.basic_rules?.timesheet_type[0]).length == 0){
  //   this.request.rules.basic_rules.timesheet_type = []

  // }
this.request['hierarchy_ids'] = id;
  }

  sidebarClose() {
    this.hierarchyVisibility = 'hidden';
    if(!this.isHierarchySelected) {
      this.alertService.error('Please select hierarchy');
      this.request.hierarchy_id= "";
    }
  }

  changeDefaultHierarchy() {
    // this.selectedHierarchyLevel = this.basicJobInfo.selectedHierarchy;
    // if(this.basicJobInfo.selectedHierarchy) {
    //   this.createJobForm.patchValue({hierarchy: this.basicJobInfo.selectedHierarchy.name});
    //   this._changeDetectorRef.detectChanges();
      this.sidebarClose();
    // } else {
    //   this.sidebarClose();
    // }

  }

  sidebarOpen() {
    if(this.mode != this.configurationMode.View){
      this.hierarchyVisibility = 'visible';
    }
  }

  addHierarchy(hierarchy) {
    hierarchy.hierarchies.forEach(hierarchie => {
      if (hierarchie.is_enabled) {
        this.hierarchies.push({
          id: hierarchie.id,
          name: hierarchie.name,
        });
        if (hierarchie.hierarchies && hierarchie.hierarchies.length > 0) {
          this.addHierarchy(hierarchie);
        }
      } else {
        return;
      }
    });
  }

  addBreakTime() {
    this.request.rules.basic_rules.break.options.push(
      {
        "type": null,
        "is_mandatory": false,
        "is_paid_inclusive": false,
        "is_validate_break_limit": false,
        "break_rule": [
          {
            "break_number": "0",
            "min_hours": 0,
            "operator": "AND",
            "max_hours": 0,
            "max_duration": 0
          }
        ],
        "penality_rule": {
          "is_allow": false,
          "limit": null,
          "rate": null,
          "value": null,
          "unit": "hour"
        }
      }
    );
  }

  updatePenaltyRule(breakRule){
    const is_allow= breakRule.penality_rule.is_allow;
    breakRule.penality_rule= {
      "is_allow": is_allow,
      "limit": null,
      "rate": null,
      "value": null,
      "unit": "hour"
    };
  }

  createForm() {
    this.options = this.timeSheetConfigService.getTimesheetDropdownOptions();
    this.options.timeSheetTypes = []
    this.selectedTimesheet = []
    this.request = this.timeSheetConfigService.getDefaultTimeSheetConfig();
    // TODO This should be async after request is populated --> this.populateUploadLevel();
    this.populateUploadLevel();
  }



  onProjectTypeSelection(selectedProjectTypes){
    this.secondProjects=[];
    this.secondProjectsDropdown= [];
    if(selectedProjectTypes?.length > 0){
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

  onProjectSelection(selectedProjects){
    this.thirdProjects=[];
    this.thirdProjectsDropdown= [];
    this.secondProjectsDropdown?.forEach(project => {
      if(selectedProjects?.includes(project?.name) && project.isCombined){
        this.thirdProjectsDropdown= [...this.thirdProjectsDropdown, ...project.combo];
      }
    });
  }

  populateUploadLevel() {
    this.options.uploadLevels.forEach(level => {
      if (this.request.rules.basic_rules.upload.option[level.value].is_allow) {
        this.uploadLevel = level.value;
      }
    });

  }

  uploadLevelChanged(event) {
    this.options.uploadLevels.forEach(level => {
      this.request.rules.basic_rules.upload.option[level.value].is_allow = false
    });

    this.request.rules.basic_rules.upload.option[event].is_allow = true;
  }

  addBreak(breakRule) {
    let count = 0;
    if (breakRule && breakRule.length > 0) {
      breakRule.forEach(element => {
        if (element.break_number > count) {
          count = element.break_number;
        }
      });
    }
    breakRule.push({
      break_number: count + 1,
      min_hours: 0,
      operator: 'AND',
      max_hours: 0,
      max_duration: 0
    });

  }

  removeBreak(rule, breakRules) {
    breakRules = breakRules.filter(element => {
      return element.break_number !== rule.break_number;
    });
    return breakRules;
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
            this.locations = locations;
          }
        }, error: (error: Error | any) => {
          this.alertService.error(errorHandler(error), {});
        }
      }
    );
  }

  updateWorkPeriodConfig(){
    if(this.request.rules.basic_rules.work_week.period?.toLowerCase() !== 'x weekly'){
      this.request.rules.basic_rules.work_week.week_number= null;
    }
    if(this.isWeekly()){
      this.request.rules.basic_rules.work_week.month_start_day= null;
    }
    /* else {
      this.request.rules.basic_rules.work_week.week_start_day= null;
    } */
  }

  updateProjectInfo(){
    this.request.rules.basic_rules.project.is_allow = !this.request.rules.basic_rules.project.is_allow;
    if(!this.request.rules.basic_rules.project.is_allow){
      this.projectTypes= null;
      this.secondProjects= null;
    }
  }

  updateNotesConfig(){
    this.request.rules.basic_rules.notes.is_allow = !this.request.rules.basic_rules.notes.is_allow;
    if(!this.request.rules.basic_rules.notes.is_allow){
      this.request.rules.basic_rules.notes.option.week_level.is_allow= false;
      this.request.rules.basic_rules.notes.option.week_level.is_mandatory= false;
      this.request.rules.basic_rules.notes.option.day_level.is_allow= false;
      this.request.rules.basic_rules.notes.option.day_level.is_mandatory= false;
    }
  }

  updateCopyTSConfig(){
    this.request.rules.basic_rules.copy_timesheet.is_allow = !this.request.rules.basic_rules.copy_timesheet.is_allow;
    if(!this.request.rules.basic_rules.copy_timesheet.is_allow){
      this.request.rules.basic_rules.copy_timesheet.option.period= null;
    }
  }

  updateSoftDeleteConfig(){
    this.request.rules.basic_rules.soft_delete.is_allow = !this.request.rules.basic_rules.soft_delete.is_allow;
    if(!this.request.rules.basic_rules.soft_delete.is_allow){
      this.request.rules.basic_rules.soft_delete.option=[];
    }
  }

  validateDays(){
    if(this.request.rules.basic_rules.working_days_in_week == 7){
      this.request.rules.basic_rules.weekend.option= [];
      this.request.rules.basic_rules.weekend.is_allow_entry= false;
    }
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
    this.request.rules.basic_rules.grace_period.option.worker.is_allow= false;
    this.request.rules.basic_rules.grace_period.option.vendor.is_allow= false;
    this.request.rules.basic_rules.grace_period.option.msp.is_allow= false;
  }
   saveAction() {
     this.setDefaultsToFalse();
     this.request.rules.basic_rules.timesheet_type = this.request?.rules?.basic_rules?.timesheet_type?.map(element => {
      return element?.toLowerCase();
    });
    if(!this.request.title){
      this.alertService.error("Please provide Timesheet configuration name");
      return;
    }
    if(!this.request.hierarchy_ids){
      this.alertService.error("Please select hierarchy");
      return;
    }
    if(!this.request.rules.basic_rules.timesheet_type?.length || this.request.rules.basic_rules.timesheet_type?.length == 0){
      this.alertService.error("Please select Timesheet type");
      return;
    }
    if(!this.request?.rules?.basic_rules?.work_week?.period){
      this.alertService.error("Please select Work Period");
    }else {

      if(!this.request.rules.basic_rules.work_week.week_start_day){ //["weekly", "bi-Weekly", "x weekly"].includes(this.request?.rules?.basic_rules?.work_week?.period) &&
        this.alertService.error("Please select start of the week day");
        return;
      }
      if(["half month", "monthly"].includes(this.request?.rules?.basic_rules?.work_week?.period) && !this.request.rules.basic_rules.work_week.month_start_day){
        this.alertService.error("Please select Month start date");
        return;
      }
      if(this.request?.rules?.basic_rules?.work_week?.period?.toLowerCase() === 'x weekly' && !this.request.rules.basic_rules.work_week?.week_number){
        this.alertService.error("Please select week number");
        return;
      }
    }
    if(this.isHourly()){
      if(!this.request.rules.basic_rules.hour_type_calculation){
        this.alertService.error("Please select hour type calculation");
        return;
      }
      if(!this.request.rules.basic_rules.hours_input_type.type){
        this.alertService.error("Please select hours input type");
        return;
      }
      if(!this.request.rules.basic_rules.hours_input_type.format){
        this.alertService.error("Please select hours input format");
        return;
      }
    }
    if(this.request?.rules?.basic_rules?.project?.is_allow && this.secondProjects?.length == 0){
      this.alertService.error("Please select Project Type");
      return;
    }
    if(this.request.rules.basic_rules.working_days_in_week > 7){
      this.alertService.error("Please enter valid working days in week");
      return;
    }
    if(this.request.rules.basic_rules.allowed_maximum_weekly_hours && this.request.rules.basic_rules.working_days_in_week && (this.request.rules.basic_rules.allowed_maximum_weekly_hours > this.request.rules.basic_rules.working_days_in_week * 24)){
      this.alertService.error("Please enter valid Max no.of ST hours / Week");
      return;
    }
    if(this.request.rules.basic_rules.allowed_maximum_daily_hours && this.request.rules.basic_rules.allowed_maximum_daily_hours > 24){
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

    if((this.request.rules.basic_rules.grace_period.option.worker.period == null&& this.request.rules.basic_rules.grace_period.option.worker.type) ||
     (!this.request.rules.basic_rules.grace_period.option.worker.type && this.request.rules.basic_rules.grace_period.option.worker.period && this.request.rules.basic_rules.grace_period.option.worker.period >=0)){
      this.alertService.error("Please enter valid worker grace period access");
      return;
    }else if(this.request.rules.basic_rules.grace_period.option.worker.type && this.request.rules.basic_rules.grace_period.option.worker.period){
      this.request.rules.basic_rules.grace_period.is_allow= true;
      this.request.rules.basic_rules.grace_period.option.worker.is_allow= true;
    }

    if((this.request.rules.basic_rules.grace_period.option.vendor.period == null && this.request.rules.basic_rules.grace_period.option.vendor.type) ||
     (!this.request.rules.basic_rules.grace_period.option.vendor.type && this.request.rules.basic_rules.grace_period.option.vendor.period && this.request.rules.basic_rules.grace_period.option.vendor.period >=0)){
      this.alertService.error("Please enter valid vendor grace period access");
      return;
    }else if(this.request.rules.basic_rules.grace_period.option.vendor.type && this.request.rules.basic_rules.grace_period.option.vendor.period){
      this.request.rules.basic_rules.grace_period.is_allow= true;
      this.request.rules.basic_rules.grace_period.option.vendor.is_allow= true;
    }

    if((this.request.rules.basic_rules.grace_period.option.msp.period == null && this.request.rules.basic_rules.grace_period.option.msp.type) ||
     (!this.request.rules.basic_rules.grace_period.option.msp.type && this.request.rules.basic_rules.grace_period.option.msp.period && this.request.rules.basic_rules.grace_period.option.msp.period >=0)){
      this.alertService.error("Please enter valid msp grace period access");
      return;
    }else if(this.request.rules.basic_rules.grace_period.option.msp.type && this.request.rules.basic_rules.grace_period.option.msp.period){
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
    }else if(this.request.rules.basic_rules.past_period.option.vendor.type && this.request.rules.basic_rules.past_period.option.vendor.period){
      this.request.rules.basic_rules.past_period.is_allow= true;
      this.request.rules.basic_rules.past_period.option.vendor.is_allow= true;
    }

    if((this.request.rules.basic_rules.past_period.option.msp.period == null && this.request.rules.basic_rules.past_period.option.msp.type) ||
     (!this.request.rules.basic_rules.past_period.option.msp.type && this.request.rules.basic_rules.past_period.option.msp.period && this.request.rules.basic_rules.past_period.option.msp.period >=0)){
      this.alertService.error("Please enter valid msp past period access");
      return;
    }else if(this.request.rules.basic_rules.past_period.option.msp.type && this.request.rules.basic_rules.past_period.option.msp.period){
      this.request.rules.basic_rules.past_period.is_allow= true;
      this.request.rules.basic_rules.past_period.option.msp.is_allow= true;
    }
   let name = this.request.hierarchy_ids.map(n => n?.name)
   if(name[0]) {
    this.request['hierarchy_ids'] = this.request.hierarchy_ids.map(n => n?.id)

   }
    this.request.rules.basic_rules.is_allow_mass_approval = this.currentprogram?.config?.bulk_timesheet_approval || false;
    this.saveInprogress = true;
    this.currentprogram= this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let url = `/timesheet/programs/${this.currentprogram?.id}/config/basic`;
    let methodType= 'post';
    if(this.mode === this.configurationMode.Edit && this.configId){
      url += `/${this.configId}`;
      methodType= 'put';
    }
    if(this.secondProjects?.length > 0 && this.request.rules.basic_rules.project.option){
      this.secondProjectsDropdown.forEach(dropdown => {
        if(this.secondProjects.includes(dropdown.name)){
          this.request.rules.basic_rules.project.option.push(dropdown);
        }
      });

    }

    const basic_rules = this.request.rules.basic_rules;
    if(basic_rules && !basic_rules.time_format && !this.isDayTimesheet() && this.isCico()) {
      this.alertService.error('Please select the time format');
      this.saveInprogress = false;
      return;
    }

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
    if(!this.request.location){
      this.request.location = [];
    }
    // end
    const status = this.request['status'];
    if(status && (typeof status === 'string')) {
      this.request.status = (status.toLowerCase() === 'active')?true:false;
    }
     this.logs = undefined;
      this.request.start_date = this.localDatePipe.transform(this.request.start_date, DATE_FORMAT?.FORMATYMD ,null ,null , true, this.dateFormat)
      this.timeSheetConfigService[methodType](url, this.request).subscribe((data: any) => {
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

  loadTimesheetConfiguration() {

    this.currentprogram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const url = `/timesheet/programs/${this.currentprogram?.id}/config/basic/${this.configId}`;
    this.timeSheetConfigService.get(url)
      .subscribe({
        next: (data: any) => {
          this.request = this.mergeDeep(this.request, data.data);
          //{...this.request, ...data.data};
          if (data?.data?.rules?.basic_rules?.day_type) {
            this.populateDayType(data?.data?.rules?.basic_rules?.day_type);
          }
          if (data?.data?.rules?.basic_rules?.timesheet_start_date) {
            // this.request.start_date=  data?.data?.rules?.basic_rules?.timesheet_start_date;
            this.request.start_date = this.localDatePipe.transform(data?.data?.rules?.basic_rules?.timesheet_start_date, this.dateFormat ,null ,null , true, DATE_FORMAT?.FORMATYMD)
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
          this.logs = undefined;
          if(this.request?.location){
            this.locations = [... this.locations, ... this.request?.location];
            this.locations = [...new Map(this.locations?.map(item => [item['id'], item]))?.values()];
            this.request.location = this.request?.location.map(n => n.id);
          }
          if (this.mode != ConfigurationMode.Clone) {
            this.request.hierarchy = data?.data?.hierarchy;
            this.request.hierarchy_id = data?.data?.hierarchy?.id;
            // this.defaultHierarchy = [data?.data?.hierarchy?.id];
            if(this.request?.hierarchies){
            this.defaultHierarchy= this.request?.hierarchies.map(n => n.id);
            this.selections = this.defaultHierarchy;
          // this.request['hierarchy_ids'] = this.request?.hierarchy_ids.map(n => n.id);
            }else {
              this.defaultHierarchy= [this.request?.hierarchy?.id];
            this.request.hierarchy.name = this.request?.hierarchy?.name;
          // this.request['hierarchy_ids'] = this.request?.hierarchy?.id;
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
              .filter((value, index, self) => { if (value) { return self?.indexOf(value) === index } });
            this.onProjectTypeSelection(this.projectTypes);
            this.secondProjects = this.request?.rules?.basic_rules?.project?.option?.map(item => (item?.name || item?.title))
              .filter((value, index, self) => self?.indexOf(value) === index);
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

  openProjectModal() {
    this.projectModal = true;
  }

  loadTSConfigurationHistory() {

    this.logs = undefined;
    this.currentprogram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const url = `/timesheet/programs/${this.currentprogram?.id}/config/basic/${this.configId}/history`;
    this.timeSheetConfigService.get(url)
      .subscribe({
        next: (data: any) => {

          // Modified history object
          data?.data.forEach(obj => {
            obj.date = obj?.created_at.split(' ')[0].replace('-', '/')?.replace('-', '/');
            obj.time = obj?.created_at.split(' ')[1];
            obj.name = obj?.created_by?.name;
          });

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
  closeConfigModal() {
    this.projectModal = false;
  }

  // timesheet inhancement
  requiredCheck() {
   let data = this.dayType?.filter(d => d?.checked === true );
   if(data?.length === 1){
    return true;
   } else {
    return false;
   }
  }

  isDayTimesheet() {
    return this.request?.rules?.basic_rules?.timesheet_type?.find(t => { return t?.toLowerCase() === TimesheetType?.DAY?.toLowerCase()})
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
}
