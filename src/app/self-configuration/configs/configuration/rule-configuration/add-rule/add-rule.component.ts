import { Component, Input, OnInit, Output,EventEmitter } from '@angular/core';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { RuleConfigurationService } from 'src/app/self-configuration/configs/configuration/rule-configuration/rule-configuration.service';
enum RuleType {
  DOUBLE_TIME = 'DOUBLE_TIME',
  OVER_TIME = 'OVER_TIME',
  STANDARD = 'STANDARD',
  OTHER = 'OTHER'
}
@Component({
  selector: 'app-add-rule',
  templateUrl: './add-rule.component.html',
  styleUrls: ['./add-rule.component.scss']
})
export class AddRuleComponent implements OnInit {
  searchTerm$ = new Subject<string>();
  selectedIndex: any;
  addRule:boolean = false;
  private subscriptions: Subscription[] = [];
  @Input() request: any;
  @Output() toggleValue = new EventEmitter();
  @Output() selectConfigRule = new EventEmitter();
  rateFactors:any = [];
  applyRateLoading : boolean = false;
  ruleApplyoptions = [{label:'Holiday', value:'holiday'},{label:'Weekend', value:'weekend'},{label:'All Others Except Weekend and Holiday', value:'overtime'} ];
  ruleDurationOptions = [{label:'Daily', value:'daily'}, { label:'Weekly', value:'weekly'}, {label:'Nth Day',value:'nthday'}];
  ruleDurationHolidayOptions = [
    {label:'Working-Paid',value:'working-paid'},
    {label:'Non-Working-Paid',value:'non-working-paid'},
    {label:'Working-Unpaid',value:'working-non-paid'},
    {label:'Non-Working-Unpaid',value:'non-working-non-paid'}
  ];
  weekendOptions = [];
  typeOptions = [{label:'Hours', value: 'hours'}, {label:'Nth day', value:'nthday'}];
  logicalOperatorOptions = ['AND'];
  operatorOptions = [{label:'Less Than Equal (<=)',value:'<='},{label: 'Less Than (<)', value:'<'}, {label:'Equal (=)', value:'='},{label:'Greater Than (>)', value:'>'}, {label:'Greater Than Equal (>=)',value:'>='}]
  constructor(
    private eventStream: EventStreamService,
    private ruleConfigurationService: RuleConfigurationService,
    private storageService: StorageService,
  ) { }

  ngOnInit(): void {
    this.getRateFactor();
    this.subscriptions.push(this.eventStream.on(Events?.ADD_RULE).subscribe((data: any) => {
      if (data) {
        this.setWeekendOption(data?.basic_config_id);
       this.addRule = true
      }
    }));
    this.searchTerm$
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(searchTerm => {
        this.searchRateValues(searchTerm);
      });
  }

  setWeekendOption(basic_config_id:any){
    if(basic_config_id){
      const currentprogram = this.storageService.get(StorageKeys?.CURRENT_PROGRAM);
      let url = `/timesheet/programs/${currentprogram?.id}/config/basic/${basic_config_id}`;
      this.ruleConfigurationService.get(url)
      .subscribe((data:any) => {
        this.weekendOptions = [];
        let allOption = [{label:'All (Weekend Configuration)',value:'all'}];
        let otherOption = [];
        data?.data?.rules?.basic_rules?.weekend?.option.forEach(element => {
          otherOption.push({label:element?.charAt(0)?.toUpperCase() + element?.slice(1), value:element})
        });
        this.weekendOptions = otherOption?.length >0 ? allOption?.concat(otherOption) : allOption;
      }, (err) => {
        if(err) {
          console.error(err);
        }
      });
    }  
    if(!this.request?.rules_config?.length){
      this.addConfigRule();
    }
  }

  searchRateValues(event) {
    this.getRateFactor(event)
  }

  // get rate factors
  getRateFactor(term?){
    const currentprogram = this.storageService.get(StorageKeys?.CURRENT_PROGRAM);
    let url = `/configurator/programs/${currentprogram?.id}/rate-factors/multiple_rate_factors?limit=150&page=1`;
    const requestBody: any = {};
    if (this.selectedIndex != null && this.request?.rules_config?.[this.selectedIndex]?.apply_on) {
      const applyOn = this.request?.rules_config?.[this.selectedIndex]?.apply_on;
      if (applyOn === 'overtime') {
        requestBody.type = [RuleType?.DOUBLE_TIME, RuleType?.OVER_TIME, RuleType?.STANDARD, RuleType?.OTHER];
      } else {
        requestBody.type = [applyOn?.toUpperCase()];
      }
    } else {
      requestBody.type = [RuleType?.DOUBLE_TIME, RuleType?.OVER_TIME, RuleType?.STANDARD, RuleType.OTHER];
    }

    if (term) {
      requestBody.name = term;
    }
    this.applyRateLoading = true
    this.ruleConfigurationService.post(url,requestBody)
    .subscribe((data: any) => {
      this.applyRateLoading = false
      // if(data?.rate_factors?.length > 0) {
        this.rateFactors = data?.rate_factors;
      // }
    }, (err) => {
      if(err) {
        this.applyRateLoading = false
      }
    });
  }

  getRuleDuration(index:number){
    this.selectedIndex = index;
    this.request.rules_config[index].rules[0].periodicity= '';
    this.changeSelection();
  }



  async sidebarClose() {
     this.addRule = false;
  }

  changeSelection(value?)  {
    this.selectConfigRule.emit(this.request);
  }

  changeRateType(value?, rules?) {
    const filteredData = this.rateFactors?.filter(item => item?.abbreviation === value);
    rules.rate_type = filteredData?.[0]?.type;
  }

  addConfigRule(){
    this.selectedIndex = null;
    this.getRateFactor(null);
    let requestData = this.ruleConfigurationService.getDefaultRuleConfig();
    let itemCloned = requestData?.rules_config[0];
    this.request?.rules_config.push(itemCloned);
  }

  addMoreCondition(i) {
    let requestData = this.ruleConfigurationService.getDefaultRuleConfig();
    let itemCloned = requestData?.rules_config[0]?.rules[0]?.conditions[0];
    let conditionLength = (this.request?.rules_config[i]?.rules[0]?.conditions?.length - 1);
    this.request?.rules_config[i]?.rules[0]?.conditions?.push(itemCloned);
    this.request.rules_config[i].rules[0].conditions[conditionLength].logical_operator = 'AND';
  }

  deleteCondition(i,j) {
    this.request?.rules_config[i]?.rules[0]?.conditions?.splice(j,1);
    this.request.rules_config[i].rules[0].conditions[j-1].logical_operator = '';
  }
}
