import { Component, OnInit } from '@angular/core';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { ActivatedRoute } from '@angular/router';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { TimesheetService } from 'src/app/wipro-timesheet/timesheet.service';
import { CommonViewRuleFlowService } from 'src/app/shared/components/common-view-rule-flow/common-view-rule-flow.service';
import { RuleConfigurationService } from 'src/app/self-configuration/configs/configuration/rule-configuration/rule-configuration.service';
@Component({
  selector: 'app-view-rule-configuration',
  templateUrl: './view-rule-configuration.component.html',
  styleUrls: ['./view-rule-configuration.component.scss']
})
export class ViewRuleConfigurationComponent implements OnInit {
  details : any = [];
  ruleConfigData:any;
  rateFactors:any = [];
  ruleDurationOptions = [
    {label:'Working-Paid',value:'working-paid'},
    {label:'Non-Working-Paid',value:'non-working-paid'},
    {label:'Working-UnPaid',value:'working-non-paid'},
    {label:'Non-Working-UnPaid',value:'non-working-non-paid'}
  ];
  ruleDurationOptionsall = [{label:'Daily', value:'daily'}, { label:'Weekly', value:'weekly'}, {label:'Nth Day',value:'nthday'}];
  operatorOptions = [{label:'Less Than Equal (<=)',value:'<='},{label: 'Less Than (<)', value:'<'}, {label:'Equal (=)', value:'='},{label:'Greater Than (>)', value:'>'}, {label:'Greater Than Equal (>=)',value:'>='}];
  ruleApplyoptions = [{label:'All', value:'overtime'}, {label:'Weekend', value:'weekend'}, {label:'Holiday', value:'holiday'}];
  typeOptions = [{label:'Hours', value: 'hours'}, {label:'Nth day', value:'nthday'}];
  weekendOptions:any = [];
  timesheetName= '';
  constructor(private router: SvmsRouterService,
    private ruleConfigurationService: RuleConfigurationService,
    private timesheetService : TimesheetService,
    public commonView: CommonViewRuleFlowService,
    private storageService: StorageService,
    private activatedRoute: ActivatedRoute) { }

  ngOnInit(): void {
    this.getRateFactor();
    this.activatedRoute.queryParams
      .subscribe(params => {
        let id = params['id'];
        if(id){          
          this.getConfigDetail(id);
        }
      });
  }

  getRuleDuration(periodicity:string,applyon:string){
    var value = '';
    if(applyon == 'overtime'){
      this.ruleDurationOptionsall.forEach(element => {
        if(element?.value?.toLowerCase() == periodicity?.toLowerCase()){
          value = element?.label;
        }
      });
    }else{
      this.ruleDurationOptions.forEach(element => {
        if(element?.value?.toLowerCase() == periodicity?.toLowerCase()){
          value = element?.label
        }
      });
    }
    return value;
  }

  setWeekendOption(basic_config_id:any){
    if(basic_config_id){
      const currentprogram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
      let url = `/timesheet/programs/${currentprogram?.id}/config/basic/${basic_config_id}`;
      this.ruleConfigurationService.get(url)
      .subscribe((data:any) => {
        this.weekendOptions = [];
        let allOption = [{label:'All (Weekend Configuration)',value:'all'}];
        let otherOption = [];
        data?.data?.rules?.basic_rules?.weekend?.option.forEach(element => {
          otherOption.push({label:element.charAt(0).toUpperCase() + element.slice(1), value:element})
        });
        this.weekendOptions = otherOption.length >0 ? allOption.concat(otherOption) : allOption;
      }, (err) => {
        if(err) {
          console.error(err);
        }
      });
    }    
  }

  getRuleApply(applyon:string){
    var value = '';
    this.ruleApplyoptions.forEach(element => {
      if(element?.value?.toLowerCase() == applyon?.toLowerCase()){
        value = element?.label
      }
    });
    return value;
  }
  getTimesheetName(timesheetId:string){
    const currentprogram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    const url = `/timesheet/programs/${currentprogram?.id}/config/basic/${timesheetId}`
    this.timesheetService.get(url)
    .subscribe({
      next: (data: any) => {
        this.timesheetName = data?.data?.title;
          this.details = [{
            label : "Rule Configuration Name",
            value : this.ruleConfigData?.title,
            displayType : 'text'
          },
          {
            label : "Status",
            value : this.ruleConfigData?.status ? 'Active' : "Inactive",
            displayType : 'status',
            enabled : this.ruleConfigData?.status
          },
          {
            label : "Timesheet Configuration",
            value : this.timesheetName,
            displayType : 'text'
          },
          {
            label : "Hierarchy",
            value : this.ruleConfigData?.hierarchies,
            displayType : 'box-view'
          },
          // {
          //   label : "Work Locations",
          //   value : this.ruleConfigData?.location == null ? 'All': this.getLocationString(this.ruleConfigData?.location),
          //   displayType : 'text'
          // }
        ]
      }
    });    
  }

  getLocationString(locations){
    var workLocation= [];
    locations?.forEach(element => {
      workLocation.push(element?.name);
    });
    return workLocation.toString();
  }

  getRateFactor(){
    const currentprogram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let url = `/configurator/programs/${currentprogram?.id}/rate-factors?limit=150&page=1`;
    this.ruleConfigurationService.get(url)
    .subscribe((data: any) => {
      if(data?.rate_factors?.length > 0) {
        this.rateFactors = data?.rate_factors;
      }
    });
  }

  getRateFactorName(ratefactor:string){
    var value = '';
    this.rateFactors.forEach(element => {
      if(element?.abbreviation?.toLowerCase() == ratefactor?.toLowerCase()){
        value = element?.name;
      }
    });
    return value;
  }

  getConfigDetail(Id) {
    let currentProgram = this.storageService.get(StorageKeys?.CURRENT_PROGRAM);
      const url = `/timesheet/programs/${currentProgram?.id}/config/rule/${Id}`;
      this.ruleConfigurationService.get(url)
        .subscribe({
          next: (data: any) => {
            this.ruleConfigData = data?.data;
            this.getTimesheetName(this.ruleConfigData?.basic_config_id);
            this.setWeekendOption(this.ruleConfigData?.basic_config_id);
      }
    });    
  }

  get created_on(): number {
    return Number.parseFloat(this.ruleConfigData?.created_on || 0);
  }

  get modified_on(): number {
    return Number.parseFloat(this.ruleConfigData?.updated_on || 0);
  }

  getWeekendDay(day:string){
    var value = '';
    this.weekendOptions.forEach(element => {
      if(element?.value?.toLowerCase() == day?.toLowerCase()){
        value = element?.label;
      }
    });
    return value;
  }

  getConditionType(conditionType:string){
    var value = '';
    this.typeOptions.forEach(element => {
      if(element?.value?.toLowerCase() == conditionType?.toLowerCase()){
        value = element?.label
      }
    });
    return value;
  }

  getConditionOperator(operator:string){
    var value = '';
    this.operatorOptions.forEach(element => {
      if(element?.value?.toLowerCase() == operator?.toLowerCase()){
        value = element?.label
      }
    });
    return value;
  }

  editRuleConfig() {
    let id = this.activatedRoute?.snapshot?.queryParamMap?.get('id')
    this.router.navigate(['configuration', 'timesheet-rule', 'create'], { queryParams: { id: id, mode: 'edit' } });
  }

  backClicked() {
    this.router.navigate(['configuration', 'timesheet-rule', 'list']);
  }
}
