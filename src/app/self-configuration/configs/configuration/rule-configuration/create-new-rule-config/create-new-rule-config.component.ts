import { Component, OnInit } from '@angular/core';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { ActivatedRoute } from '@angular/router';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { ITableOptions, ITablePaginationConfig } from 'src/app/library/svms-table/svms-table.model';
import { EventStreamService, Events, EmitEvent } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { RuleConfigurationService } from 'src/app/self-configuration/configs/configuration/rule-configuration/rule-configuration.service';
import { debounceTime, Subject,distinctUntilChanged } from 'rxjs';
import { ConfigurationMode } from 'src/app/program-setup/expense-configuration/enums/configuration-mode.enums';
import { TimesheetConfigurationService } from 'src/app/program-setup/timesheet-configuration/timesheet-configuration.service';
import * as _ from 'lodash';

@Component({
  selector: 'app-create-new-rule-config',
  templateUrl: './create-new-rule-config.component.html',
  styleUrls: ['./create-new-rule-config.component.scss']
})
export class CreateNewRuleConfigComponent implements OnInit {
  public request: any = {};
  public titleToggle = {
    title: 'active',
    value: true
  };
  dataLoader: any = false;
  currentprogram: any = undefined;
  public locations: Array<Object> = [];
  public allLocations: Array<Object> = [];
  public hierarchies:any = null;
  public timesheets:any = null;
  public selections: Array<string> = [];
  public defaultSelections: Array<string> = [];
  isHierarchySelected:boolean= false;
  workLocation = new Subject<string>();
  public saveInprogress = false;
  logs: Log = undefined;
  isDialogVisible:boolean = false;
  configtimesheetList:any =[];
  public mode:string= undefined;
  public configId:string= undefined;
  public itemPerPage = 10;
  private pageNo = 0; 
  public tablePaginationConfig: ITablePaginationConfig;
  public readonly configurationMode = ConfigurationMode;
  totalRecords: number;
  isToggled: boolean;
  ruleAssignmentCount : number;
  public tableOptions: ITableOptions;
  isToggleChanged: boolean;
  isActiveToggle: boolean;
  availableHierarchy:any = []
  constructor(
    private eventStream: EventStreamService,
    private router: SvmsRouterService,
    private storageService: StorageService,
    private ruleConfigurationService: RuleConfigurationService,
    private timeSheetConfigService: TimesheetConfigurationService,
    private alertService: AlertService,
    private activatedRoute: ActivatedRoute
  ) {
    
    this.workLocation.pipe(debounceTime(300), distinctUntilChanged()).subscribe((value: any) => {
      this.getWorkLocations();
    });
   }
   impactedTimesheetColomnDefn = [
    { field: 'code', header: 'TIMESHEET ID', width: 5, order: 1, sortable: true, primary: true },
    { field: 'user.name', header: 'WORKER NAME', width: 5, order: 2, primary: true },
    { field: 'desc', header: 'ASSIGNMENT NAME & ID', width: 5, order: 3, primary: true }
  ];
 
  ngOnInit(): void {
    this.getHierarchy();
    this.request = this.ruleConfigurationService.getDefaultRuleConfig();
    this.getWorkLocations();
    setTimeout(() => {
      this.activatedRoute.queryParams
      .subscribe(params => {
        this.mode = params['mode'];
        this.configId= params['id'];
        if(this.mode && this.configId){
          this.loadRuleConfiguration();
        } else {
          this.dataLoader = true;
        }
      });
    },1000)
    this.getTimesheets();
  }
  onPaginationClick = (pageNo: number) => {
    this.pageNo = pageNo;
    this.getImpactedTimesheetlist()
  }

  loadRuleConfiguration(){
    this.dataLoader = false;
      this.currentprogram = this.storageService.get(StorageKeys?.CURRENT_PROGRAM);
      const url = `/timesheet/programs/${this.currentprogram?.id}/config/rule/${this.configId}`;
      this.ruleConfigurationService.get(url)
        .subscribe({
          next: (data: any) => {
            let response = data?.data;
            let hierarchyIds = [];
            response?.hierarchies?.forEach(element => {
                hierarchyIds.push(element?.id);
              });
              if(this.mode === this.configurationMode?.Clone) {
                this.request.title = 'clone-' + response?.title || '';
                this.selections = [];
                this.defaultSelections = [];
                this.request.hierarchy_ids = [];
                const url = `/timesheet/programs/${this.currentprogram?.id}/config/basic/${response?.basic_config_id}`;
                this.timeSheetConfigService.get(url)
                .subscribe({
                next: (data: any) => {
                  var allAvailableHierarchy = [];
                      allAvailableHierarchy = data?.data?.hierarchies;
                    this.request.hierarchy_info = [];
                    hierarchyIds?.forEach(herId => {
                    allAvailableHierarchy.forEach((availId,index) =>{
                      if(herId == availId?.id){
                        allAvailableHierarchy?.splice(index,1);
                      }
                    });
                  });
                  this.availableHierarchy = allAvailableHierarchy;
                  this.disableCloneHierarchy(allAvailableHierarchy);
                }, error: (error: Error | any) => {
                  this.saveInprogress = false;
                  if (error?.error?.error?.errors && error?.error?.error?.errors[0] && error?.error?.error?.errors[0].message) {
                    this.showError(error);
                  } else {
                    this.alertService.error('Error While fetching Timesheet Configuration.');
                  }
                }
              });
              }else if(this.mode === this.configurationMode?.Edit){
                this.selections = hierarchyIds;
                this.defaultSelections = hierarchyIds;
                this.request.title = response?.title;
                this.request.hierarchy_ids = hierarchyIds;
                this.request.hierarchy_info = this.getHierarchyNameId(hierarchyIds);
                this.disableHierarchy();
              }  
            this.request.status = response?.status;
            this.isActiveToggle = this.request?.status;
            this.timesheets = [ {id:response?.basic_config?.id, title: response?.basic_config?.title }]
            this.request.basic_config_id = response?.basic_config?.id;
            this.request.rules_config = response?.rules_config;
            if(response?.location && response?.location?.length>0){
              const uniqueLocations: any = [...new Map(response?.location?.map(item => [item?.name, item]))?.values()];
              const locations = uniqueLocations?.filter(l => l?.name);
              let locationIds = []
              locations.forEach((element) => {
                locationIds.push(element?.id);
              });
              this.locations = locations;  
              this.request.location = locationIds;
            }else{
              this.locations = [{id: '', name: 'All'}];
              this.request.location = [''];
            }
            this.dataLoader = true;
          }, error: (error: Error | any) => {
            this.saveInprogress = false;
            if (error?.error?.error?.errors && error?.error?.error?.errors[0] && error?.error?.error?.errors[0].message) {
              this.showError(error);
            } else {
              this.alertService.error('Error While Saving fetching rule configuration.');
            }
             this.dataLoader = true;
          }
        });    
  }

  disableCloneHierarchy(enableHierarchies: Array <{name: string, id: string}>){
    this.hierarchies?.forEach(selections => {
      selections?.hierarchies?.forEach(hierarchylevelone => {
        hierarchylevelone?.hierarchies?.forEach(hierarchyleveltwo => {        
            hierarchyleveltwo.is_enabled = false;        
        });
      });      
    });

    enableHierarchies?.forEach(enabledId => {
      this.hierarchies?.forEach(selections => {
        selections?.hierarchies?.forEach(hierarchylevelone => {
          hierarchylevelone?.hierarchies?.forEach(hierarchyleveltwo => {        
            if(enabledId?.id == hierarchyleveltwo?.id){
              hierarchyleveltwo.is_enabled = true;  
            }
          });
        });      
      });      
    });
    this.hierarchies = _.cloneDeep(this.hierarchies);
  }

  getHierarchyNameId(hierarchy_ids){
    var hierarchy_info = [];
    hierarchy_ids.forEach(selectedId => {
      this.hierarchies.forEach(selections => {
        selections?.hierarchies.forEach(hierarchylevelone => {
          if(selectedId == hierarchylevelone?.id){
            hierarchy_info.push({'id':hierarchylevelone?.id , 'name': hierarchylevelone?.name});         
          }
          hierarchylevelone?.hierarchies.forEach(hierarchyleveltwo => {        
            if(selectedId == hierarchyleveltwo?.id){
              hierarchy_info.push({'id':hierarchyleveltwo?.id , 'name': hierarchyleveltwo?.name});         
            }
          });
        });      
      });      
    });
    return hierarchy_info;
  }

  disableHierarchy(){
    this.hierarchies.forEach(selections => {
      selections?.hierarchies.forEach(hierarchylevelone => {
        hierarchylevelone?.hierarchies.forEach(hierarchyleveltwo => {        
            hierarchyleveltwo.is_enabled = false;          
        });
      });      
    });

    this.selections.forEach(selectedId => {
      this.hierarchies.forEach(selections => {
        selections?.hierarchies.forEach(hierarchylevelone => {
          hierarchylevelone?.hierarchies.forEach(hierarchyleveltwo => {        
            if(selectedId == hierarchyleveltwo?.id){
              hierarchyleveltwo.is_enabled = true;         
            }
          });
        });      
      });      
    });
  }
  
  //select config Rule
  selectConfigRule(value: any) {
    this.request = value
  }

  // get Work Location
  getWorkLocations() {
    this.currentprogram = this.storageService.get(StorageKeys?.CURRENT_PROGRAM);
    const url = `/configurator/programs/${this.currentprogram?.id}/work-locations`;
    this.ruleConfigurationService.get(url)
      .subscribe({
        next: (data: any) => {
          if (data && data?.work_locations && data?.work_locations?.length > 0) {
            const uniqueLocations: any = [...new Map(data?.work_locations?.map(item => [item?.name, item]))?.values()];
            const locations = uniqueLocations?.filter(l => l?.name);
            const addAll = {id: '', name: 'All'}
            this.locations = [addAll].concat(locations);
            this.allLocations = [addAll].concat(locations);
          }
        }, error: (error: Error | any) => {
          this.alertService.error(errorHandler(error), {});
        }
      }
    );
  }

  // get Hierarchy details
  getHierarchy() {
    this.currentprogram= this.storageService.get(StorageKeys?.CURRENT_PROGRAM);
    let url = '/configurator/programs/' + this.currentprogram?.id + '/hierarchy';
    this.ruleConfigurationService.get(url)
    .subscribe((data: any) => {
      if(data?.result?.length > 0) {
        this.hierarchies = [];
        this.hierarchies = data?.result;
      }
    });
  }

  // get active timesheets
  getTimesheets(){
    const currentprogram = this.storageService.get(StorageKeys?.CURRENT_PROGRAM);
    let url = `/timesheet/programs/${currentprogram?.id}/config/basic/details?status=active&is_pagination_included=false&fields=id,config_uuid,title,status,hierarchies,location`;
    this.ruleConfigurationService.get(url)
    .subscribe((data: any) => {
      if(data?.data?.config?.length > 0) {
        if(this.timesheets?.length > 0){
          var timesheetOldData = this.timesheets;
          const value = data?.data?.config?.find((elem)=> elem?.id == this.timesheets[0]?.id);
          this.timesheets = []; 
          this.timesheets = data?.data?.config;
          if(!value?.id){
            this.timesheets.push({id: timesheetOldData[0]?.id, title: timesheetOldData[0]?.title});
          }
        }else{
          this.timesheets = data?.data?.config;
        }
      }
    });
  }
  
  setHierarchyLocation(timesheetId:string){
    let timesheetData = this.timesheets.filter(timesheet=> timesheetId == timesheet?.id);
    var hierarchyIds = []
    if(timesheetData[0]?.hierarchies){
      timesheetData[0]?.hierarchies.forEach(element => {
        hierarchyIds.push(element);
      });
    }
    this.selections = hierarchyIds;
    this.defaultSelections = hierarchyIds;
    var allAvailableHierarchy = [];
    allAvailableHierarchy = timesheetData[0]?.hierarchies;
    this.availableHierarchy = allAvailableHierarchy;
    this.disableHierarchy();    
    this.request['hierarchy_ids'] = hierarchyIds;
    this.request.hierarchy_info = this.getHierarchyNameId(hierarchyIds);
    if(timesheetData[0]?.location && timesheetData[0]?.location?.length>0){
      this.locations = [];
      this.locations.push({id: '', name: 'All'});
      this.allLocations?.forEach(loc => {
      timesheetData[0]?.location?.forEach(element => {
          if(loc['id'] == element){ this.locations.push(loc); }
        });
      });
      this.request.location = timesheetData[0]?.location;
    }else{
      this.locations = [{id: '', name: 'All'}];
      this.request.location = [''];
    }
    this.request.rules_config = [];
    let requestData = this.ruleConfigurationService.getDefaultRuleConfig();
    let itemCloned = requestData?.rules_config[0];
    this.request?.rules_config.push(itemCloned); 
  }

  // change on Hierarchy
  hierarchySelectionChanged(event: Array<string>) {
    this.selections = event;
  if (this.selections?.length && !this.defaultSelections?.length) {
    this.defaultSelections = [this.selections[0]];
  }
  if(event && event.length > 0) {
    this.request['hierarchy_ids'] = this.removeParentHierarchy(event);
    this.isHierarchySelected = true;
    this.request.hierarchy_info = this.getHierarchyNameId(event);
  } else {
    this.request['hierarchy_ids'] = event;
    this.request.hierarchy_info = [];
    this.isHierarchySelected = false;
  }
}

removeParentHierarchy(selectedHierarchy){
  var allowedHierarchy = [];
    this.availableHierarchy.forEach((availHier) => {
      selectedHierarchy.forEach((selectHier) => {
      if(this.mode === this.configurationMode?.Clone) {
        if(selectHier == availHier?.id){
          allowedHierarchy.push(availHier?.id);
        }
      }else{
        if(selectHier == availHier){
          allowedHierarchy.push(availHier);
        }
      }
      });
    });
      
  return allowedHierarchy;
}

   checkValidations(){
    if(!this.request?.title){
      this.alertService.error("Please provide rule configuration name");
      return 0;
    }    
    if(!this.request?.basic_config_id){
      this.alertService.error("Please select a timesheet configuration");
      return 0;
    }
    if(!this.request?.hierarchy_ids?.length){
      this.alertService.error("Please select hierarchy");
      return 0;
    }    
  }

  checkRuleName(){
    var value = 1;
    this.request?.rules_config.forEach(element => {
      if(!element?.name){
        this.alertService.error("Please select rule name");
        value = 0;
      }  
    });
    return value;
  }

  // checkRuleApply(){
  //   var value = 1;
  //   this.request?.rules_config.forEach(element => {
  //     if(!element?.apply_on){
  //       this.alertService.error("Please select rule apply");
  //       value = 0;
  //     }  
  //   });
  //   return value;
  // }

  checkRuleDuration(){
    var value = 1;
    this.request?.rules_config.forEach(element => {
      element?.rules.forEach(rulesElement => {
        if(!rulesElement?.periodicity){
          this.alertService.error("Please select rule duration");
          value = 0;
        }  
      });
    });
    return value;
  }

  checkRateFactor(){
    var value = 1;
    this.request?.rules_config.forEach(element => {
      element?.rules.forEach(rulesElement => {
        if(!rulesElement?.rate_factor){
          this.alertService.error("Please select rate factor");
          value = 0;
        }  
      });
    });
    return value;
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
    this.ruleConfigurationService.impactedTimesheetList(payLoad, this.configId).subscribe((res: any) => {
      this.itemPerPage = res?.data?.pagination?.per_page
      this.totalRecords =  res?.data?.pagination?.total_records;
      this.configtimesheetList  = res?.data?.impacted_list.map((timesheet: any) =>
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
      "status": this.request.status ? 'active' : 'inactive'
    }
    this.ruleConfigurationService.onRuleConfigToggleStatusChanges(payLoad, this.configId).subscribe((val) => {
      this.isToggleChanged = false;
    })
  }

  onToggle() {
    this.request.status = !this.request?.status;
    if(this.mode === this.configurationMode.View || this.mode === this.configurationMode?.Edit) {
    
    // this.ruleConfigurationService.onRuleConfigToggleStatusChanges(payLoad, this.configId).subscribe((val) => {
    //   let toggleText = this.request.status ? 'Activated' : 'Inactivated'
    //   this.alertService.success('Timesheet Configuration ' + toggleText + ' Sucessfully');
    // })
    if (!this.request?.status) {
      this.isToggled = true;
      let payload = {
        page: 1,
        per_page: 10,
        status: "inactive"
      }
      this.ruleConfigurationService.getAssignmentRuleConfig(payload, this.configId).subscribe((res: any) => {
        this.ruleAssignmentCount = res?.data?.pagination?.total_records;
      })
    }
    else{
      this.isToggled = false;
    }
  }
    if(this.isActiveToggle === this.request?.status && this.isToggleChanged) {
      this.isToggleChanged = false;
      return;
    }
    if (this.mode === this.configurationMode?.View) {
      this.isToggleChanged = true;
      const oldStatus = this.request?.status === true ? 'inactive' : 'active';
        const newStatus = oldStatus === 'active' ? 'inactive' : 'active';
      let payLoad = {
        "per_page": 10,
        "page": 1,
        "status": {
          "old": oldStatus,
          "new": newStatus
        }
      }
      this.ruleConfigurationService.impactedTimesheetList(payLoad, this.configId).subscribe((res: any) => {
        this.itemPerPage = res?.data?.pagination?.per_page
        this.totalRecords =  res?.data?.pagination?.total_records;
        this.configtimesheetList  = res?.data?.impacted_list.map((timesheet: any) =>
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
    }
  }

  onModalClose() {
    this.isDialogVisible = false;
  }
  
  checkConditionOperator(){
    var value = 1;
    this.request?.rules_config.forEach(element => {
      element?.rules.forEach(rulesElement => {
        rulesElement?.conditions.forEach(conditionElement => {
          if(conditionElement?.addrules?.operator){
            this.alertService.error("Please add value in condition");
            value = 0;
          }  
        });
      });
    });
    return value;
  }

  async saveAction(){
    let validation =  await this.checkValidations();
    if(validation == 0){
      return;
    }    
    let ruleNameValidation =  await this.checkRuleName(); 
    if(!ruleNameValidation){
      return;
    }   
    // let ruleApplyValidation =  await this.checkRuleApply(); 
    // if(!ruleApplyValidation){
    //   return;
    // }   
    let ruleDurationValidation =  await this.checkRuleDuration();    
    if(!ruleDurationValidation){
      return;
    }
    let rateFactorValidation =  await this.checkRateFactor();
    if(!rateFactorValidation){
      return;
    }
    // let conditionOperatorValidation =  await this.checkConditionOperator();    
    this.saveInprogress = true;
    this.currentprogram= this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    
    this.logs = undefined;
    if( this.request?.location?.length == 1 && this.request?.location[0] == ''){
      this.request.location = [];
    }
    if(validation != 0 && this.mode !== this.configurationMode?.Edit){
      if(this.request?.location?.length){
        this.request?.location?.forEach(element => {
          if(element == ''){
            this.request.location = []; 
          }
        });
      }
      delete this.request?.location;
      let url = `/timesheet/programs/${this.currentprogram?.id}/config/rule`;
      let methodType= 'post';
      this.ruleConfigurationService[methodType](url, this.request).subscribe((data: any) => {
        this.saveInprogress = false;
        this.alertService.success("Rule Configuration Saved Successfully.");
        this.backLink();
      }, (error) => {
        this.saveInprogress = false;
        if(error?.error?.error?.errors && error?.error?.error?.errors[0] && error?.error?.error?.errors[0].message){
          this.showError(error);
        } else {
          this.alertService.error('Error While Saving Rule Configuration.');
        }
      });
    } else if(validation != 0 && this.mode == this.configurationMode?.Edit){
      // let url = `/timesheet/programs/${this.currentprogram?.id}/config/rule/${this.configId}`;
      let url = `/timesheet/programs/${this.currentprogram?.id}/config/rule/${this.configId}/status`;
      let payload = {
        status: this.request?.status === true ? 'active' : 'inactive'
      }
      // Only status will be update here - V2M-20962
      let methodType= 'put';
      this.ruleConfigurationService[methodType](url, payload).subscribe((data: any) => {
        this.saveInprogress = false;
        this.alertService.success("Rule Configuration Update Successfully.");
        this.backLink();
      }, (error) => {
        this.saveInprogress = false;
        if(error?.error?.error?.errors && error?.error?.error?.errors[0] && error?.error?.error?.errors[0].message){
          this.showError(error);
        } else {
          this.alertService.error('Error While Updating The Rule Configuration.');
        }
      });
    }
  }

  backLink() {
    this.router.navigate(['configuration', 'timesheet-rule', 'list']);
  }

  showRuleImpactedAssignment() {
    this.router.navigate(['configuration', 'timesheet', 'impacted-assignment-details'], { queryParams: { order: 'rule', id: this.configId } });
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

  backClicked() {
    this.router.navigate(['configuration', 'timesheet-rule', 'list']);
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

  toggleValue(value:any) {
    this.request = value;
  }

  openAddRuleModal(event) {
    if(event) {
      this.eventStream.emit(new EmitEvent(Events.ADD_RULE, this.request));
    }
  }

}
