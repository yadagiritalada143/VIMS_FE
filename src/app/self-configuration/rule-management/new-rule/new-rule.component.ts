import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DndDropEvent } from 'ngx-drag-drop';
import { Subscription, fromEvent } from 'rxjs';
import { ProgramSetupService } from 'src/app/program-setup/program-setup.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { AlertService } from '../../../core/components/alert/alert.service';
import { DropdownTreeviewSelectI18n } from './dropdown-treeview-select-i18n';
import { TreeviewI18n, TreeviewItem, TreeviewConfig, TreeviewEventParser, DownlineTreeviewEventParser } from 'ngx-treeview';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
@Component({
  selector: 'app-new-rule',
  templateUrl: './new-rule.component.html',
  styleUrls: ['./new-rule.component.scss'],
  providers: [{
    provide: TreeviewI18n,
    useClass: DropdownTreeviewSelectI18n
  },
  {
    provide: TreeviewEventParser,
    useClass: DownlineTreeviewEventParser
  }],
})
export class NewRuleComponent implements OnInit {
  public newRule = {
    title: 'Active',
    value: true,
    name: 'active',
    toggleName : 'status'
  };
  recipientsData: any =[];
  rule_Obj : any = {effectiveStartDate:null,effectiveEndDate:null};
  propertyList :any = []
  ruleField : any = []
  operatorList : any = []
  showRule = false;
  level0_inner_condition : any = []
  outer_condition = []
  condition_group : any = {
    rootCondition : []
  }
  isEditMode = false;

  level_group : any = {
    rootLevel : []
  }
  moduleList : any = [];
  eventList : any = [];
  hierarchyList : any = [];
  selectedDate : any;

  programDetails: any = {};
  and_operator_id : any;
  or_operator_id : any;
  open_bracket_id : any;
  rule_id = '';
  close_bracket_id : any;
  without_open_close_bracket_list : any = [];
  allSelectedRecipientsData : any = []
  private dragStartIndex: number;
  manageWorkerStatus:boolean = false;
  costComponentStatus:boolean = false;
  initialSelectedHierarchy : any = [];
  ruleTypeList : any = [];
  ruleConfigObj = {}
  today = new Date()
  private now = new Date().setDate(this.today.getDate()-1);

  start_date_options: any = {
    language: 'English',
    timepicker: false,
    format12h: true,
    range: false,
    enabledDateRanges: [{ start: this.now }],
  };
  end_date_options: any = {
    language: 'English',
    timepicker: false,
    format12h: true,
    range: false,
    enabledDateRanges: [{ start: this.now }],
  };
  public hierarchy = [];
  public ruleLogicData : any = {};
  public hierarchyListTags = [];
  public checkboxAction: boolean = null;
  public hierarchyMap: Map <string, string> = new Map <string, string> ();
  public treeViewGeneric: Array <any> = [];
  public treeViewItems: Array <TreeviewItem> = [];
  public hierarchyConfig: any = TreeviewConfig.create({
    hasAllCheckBox: false,
    hasFilter: false,
    hasCollapseExpand: true,
    decoupleChildFromParent: false,
    maxHeight: 240,
  });

  private subscriptions: Array <Subscription> = [];
  showCondition: boolean = false;
  linkText: string = "View more";
  textVisibility: boolean = false;

  constructor (
    private Router : SvmsRouterService,
    private _alert: AlertService,
    private route: ActivatedRoute,
    private progServ: ProgramSetupService,
    private storeServ: StorageService,
    private sortPipe: SortHelperPipe,
    private localDateFormat: LocalDateFormatPipe,private loader: LoaderService,

  ) {
    this.programDetails = this.storeServ.get(StorageKeys.CURRENT_PROGRAM);
  }
  public dateFormat;

  ngOnInit(): void {
    this.setManageRemoteWorkerFlag();
    this.dateFormat = this.programDetails?.defaultDateFormat;
    this.manageWorkerStatus = this.programDetails?.config?.manage_remote_workers
    this.costComponentStatus = this.programDetails?.config?.cost_component
    this.loadModules();
    this.loadRuleType();
    this.rule_id = this.route.snapshot.params['id'];
    this.loadOperators();
    if (this.rule_id) {
      this.isEditMode = true
      this.getruleConfigDetail()
    }
    this.loadHierarchies();
  }

  toggleCondition() {
    this.showCondition = !this.showCondition;
  }

  // Go back to listing page
  backToPage() {
    this.Router.navigate(['program', 'rules-builder', 'list']);
  }

  // To add new group in Define Condition
  addOuterCondition() {
    this.condition_group.rootCondition.push({
      inner_condition : [{
        selectedProperty : null,
        selectedOperator : null,
        selectedValue:null,
        innerisANDSelected :true,
        inner_condition : []
      }],
      isANDSelected : true
    })
  }
  setManageRemoteWorkerFlag(){
    this.loader.show();
    let url: string = `/configurator/programs/${this.programDetails.id}`;
    this.progServ.get(url).subscribe({
      next: (data: any) => {
        this.loader.hide();
        if (data?.program?.config) {
          this.manageWorkerStatus = data?.program?.config?.manage_remote_workers || false
          this.costComponentStatus = data?.program?.config?.cost_component || false
        }
      }, error: (err: Error | any) => {
        this.loader.hide();
        this._alert.error(errorHandler(err));
      }
    });
  }
  // remove indent group of define condition
  removeInnerOuterGroup(event) {
    // this.condition_group.rootCondition?.innerConditionGroup[event.innerConditionInnerIndex].splice(event.outerIndex+1,1)
    this.condition_group.rootCondition[event.outerIndex].inner_condition.splice(event.innerConditionInnerIndex,1)
  }

  // To Active/Inactive rule
  onClickToggleRule(toggleTitle) {
    if(toggleTitle == 'status') {
      if (this.newRule.value) {
        this.newRule.value = false;
        this.newRule.title = "Inactive";
      }
      else {
        this.newRule.value = true;
        this.newRule.title = "Active";
      }
    }
  }

  // Call detail API to get bind values
  getruleConfigDetail() {
    this.progServ.get(`/rule-engine/rule-detail/${this.rule_id}`).subscribe({
      next: (data: any) => {
        if(data?.ruleDetails) {
          this.loadruleConfigData(data?.ruleDetails)
        }
      },
      error: err => {
        console.error(err);
      }
    });
  }

  // Auto bind field of rule confing at edit / view mode
  loadruleConfigData(ruleConfigObj) {
    this.ruleConfigObj = ruleConfigObj
    this.rule_Obj.moduleId = ruleConfigObj?.moduleId;
    this.rule_Obj.ruleName = ruleConfigObj?.ruleName;
    this.rule_Obj.eventId = ruleConfigObj?.ruleEvent?.id;
    this.rule_Obj.module_code = this.moduleList.filter(x => x.id == this.rule_Obj.moduleId)[0]?.code
    this.rule_Obj.effectiveStartDate = this.localDateFormat.transform(new Date(ruleConfigObj?.effectiveStartDate), this.dateFormat, null, null, true, DATE_FORMAT.FORMATYMD);
    this.rule_Obj.effectiveEndDate = this.localDateFormat.transform(new Date(ruleConfigObj?.effectiveEndDate), this.dateFormat, null, null, true, DATE_FORMAT.FORMATYMD);
    this.loadEvents();
    this.loadFields();
    this.newRule.value = ruleConfigObj?.enabled,
    this.rule_Obj.ruleType = ruleConfigObj?.ruleType,
    this.rule_Obj.hierarchy = ruleConfigObj?.hierarchies?.map(x => x.id);
    this.initialSelectedHierarchy = ruleConfigObj?.hierarchies?.map(x => x.id);
    let define_condition = ruleConfigObj.ruleInitialTriggerConditions
    if(define_condition?.length) {
      this.condition_group.rootCondition = this.getArrangedCondition(define_condition);
    }
  }

  // To auto bind Conditions of define condition and level condition at edit/view mode
  getArrangedCondition(conditions) {
    let innerIndex = 0;
    let rootIndex = 0;
    let rootCondition = []
    if(!conditions.length) {
      rootCondition.push({
        inner_condition : [{
          selectedProperty : null,
          selectedOperator : null,
          selectedValue:null,
          innerisANDSelected : true,
          inner_condition : []
        }],
        isANDSelected : false
      })
    }
    for(let i=0; i<conditions.length; i++) {

      if(conditions[i].indent == 0 && conditions[i].ruleFieldOperator.id == this.open_bracket_id) {
        rootCondition.push({
          inner_condition : [],
          isANDSelected : conditions[i].ruleFieldOperator.id == this.and_operator_id ? true : false
        })
      }

      if(conditions[i].ruleFieldOperator.is_seperator && conditions[i].ruleFieldOperator.id != this.open_bracket_id && conditions[i].ruleFieldOperator.id != this.close_bracket_id && conditions[i].indent == 0) {

      }

      if(conditions[i].indent == 1 && conditions[i].ruleFieldOperator.is_seperator && (conditions[i].ruleFieldOperator.id == this.and_operator_id || conditions[i].ruleFieldOperator.id == this.or_operator_id )) {
        rootCondition[rootIndex].inner_condition[innerIndex].innerisANDSelected = conditions[i].ruleFieldOperator.id == this.and_operator_id ? true : false;
        innerIndex++;
      }

      if(conditions[i].indent == 2 && conditions[i].ruleFieldConfig && conditions[i].targetFieldValue?.values.length && conditions[i].ruleFieldOperator) {
        rootCondition[rootIndex]?.inner_condition.push(conditions[i].ruleFieldConfig.config.nest_value ? {
          selectedProperty : conditions[i].ruleFieldConfig.id,
          selectedOperator : conditions[i].ruleFieldOperator.id,
          propertySlug : conditions[i].ruleFieldConfig.slug,
          selectedCustomField : conditions[i].sourceFieldMeta?.id,
          nestSearchableName : conditions[i].targetFieldObject.targetFieldObjects ? conditions[i].targetFieldObject.targetFieldObjects[0]?.name : conditions[i].targetFieldObject.targetFieldObjects,
          target_field_obj : conditions[i].targetFieldObject.targetFieldObjects ? conditions[i].targetFieldObject.targetFieldObjects : null,
          target_field_value : conditions[i].targetFieldValue.values,
        } : {
          selectedProperty : conditions[i].ruleFieldConfig.id,
          selectedOperator : conditions[i].ruleFieldOperator.id,
          searchableName : conditions[i].targetFieldObject.targetFieldObjects ? conditions[i].targetFieldObject.targetFieldObjects[0]?.name : conditions[i].targetFieldObject.targetFieldObjects,
          target_field_obj: conditions[i].targetFieldObject.targetFieldObjects ? conditions[i].targetFieldObject.targetFieldObjects : null,
          selectedValue: conditions[i].ruleFieldConfig?.config?.multiselect ? conditions[i].targetFieldValue.values : conditions[i].targetFieldValue.values[0],
        })
      }
      if(conditions[i].indent == 0 && (conditions[i].ruleFieldOperator.id == this.and_operator_id || conditions[i].ruleFieldOperator.id == this.or_operator_id )) {
          rootCondition[rootIndex].isANDSelected = conditions[i].ruleFieldOperator.id == this.and_operator_id ? true : false;
          rootIndex++;
          innerIndex= 0;
      }

    }
    return rootCondition;
  }

  // Get property list based on module and event selection
  loadFields(): void {
    if (this.rule_Obj.moduleId && this.rule_Obj.eventId) {
      this.progServ.get(`/rule-engine/modules/${this.rule_Obj.moduleId}/events/${this.rule_Obj.eventId}/schema`).subscribe({
        next: (data: any) => {
          this.ruleField = data.eventsSchemas
          this.showRule = true
        },
        error: err => {
          this._alert.error(err.error?.error?.message ? err.error?.error?.message :  err.error?.message, {})
          console.error(err);
        }
      });
    } else {
      this.propertyList = [];
      this.ruleField = [];
    }
  }

  // Get module list
  loadModules(term?): void {
    let url = `/rule-engine/programs/${this.programDetails?.id}/modules`
    term ? url = url + `&k=${term.term}` : url
    this.progServ.get(url).subscribe({
      next: (data: any) => {
        this.moduleList = this.sortPipe.transform(data?.modules, 'name');
        this.loadEvents();
      },
      error: err => {
        console.error(err);
      }
    });
  }

  // Get event list based on module selection
  loadEvents(): void {
    if (this.rule_Obj?.moduleId) {
      this.progServ.get(`/rule-engine/modules/${this.rule_Obj?.moduleId}/events`).subscribe({
        next: (data: any) => {
          if(!this.costComponentStatus){
            this.eventList = this.sortPipe.transform(data?.events?.filter(f=>!f?.dependentOnConfiguration), 'name');
          }else{
            this.eventList = this.sortPipe.transform(data?.events, 'name');
          }

        },
        error: err => {
          this._alert.error(err.error?.error?.message ? err.error?.error?.message :  err.error?.message, {})
          console.error(err);
        }
      });
    } else {
      this.eventList = [];
    }
  }

  loadRuleType(term?): void {
    let url = `/rule-engine/rule-types`
    term ? url = url + `&k=${term.term}` : url
    this.progServ.get(url).subscribe({
      next: (data: any) => {
        this.ruleTypeList = data.ruleType;
        this.loadEvents();
      },
      error: err => {
        this._alert.error(err.error?.error?.message ? err.error?.error?.message :  err.error?.message, {})
        console.error(err);
      }
    });
  }

  onlyAllowAlphaNumeric(e){
		let k = e.keyCode || e.which;
		let ok = k >= 65 && k <= 90 || // A-Z
			k >= 96 && k <= 105 || // a-z
			k >= 35 && k <= 40 || // arrows
			k == 9 || //tab
			k == 46 || //del
			k == 8 || // backspaces
      k == 32|| // space
			(!e.shiftKey && k >= 48 && k <= 57); // only 0-9 (ignore SHIFT options)

		if(!ok || (e.ctrlKey && e.altKey)){
			e.preventDefault();
		}
	};

  // Render hierarchy dropdown as tree view.
  treeViewParser(node, list: Array <any>) {
    if(node) {
      const value = node.id;
      const text = node.name;
      let checked = false;
      list.push(value);
      let children = node.hierarchies?.map(element => {
        return this.treeViewParser(element, list);
      });
      this.hierarchyMap.set(value, text);
      return { value, text, children, checked };
    }
  }

  // Function for directory to tell weather check / uncheck hierarchy base on querySelector tag
  initCheckListeners(preOrderList) {
    const treeRef = document.querySelector('ngx-treeview');
    const boxRefs = treeRef.querySelectorAll('input[type="checkbox"]');
    boxRefs.forEach((checkbox, it)=> {
      checkbox.id = preOrderList[it];
      this.subscriptions.push(
        fromEvent(checkbox, 'click').subscribe((res: any) => {
          const action = res.target.checked;
          this.checkboxAction = action;
        })
      )
    });
  }

  // Get auto populated hierarchy while edit or view mode
  selectEditItems() {
    // entry selection
    this.hierarchyListTags = [];
    if(this.rule_Obj.hierarchy) {
      let list: Array <string> = this.rule_Obj.hierarchy;
      list?.forEach(element => {
        const ref: any = document.getElementById(`${element}`);
        ref.click();
      });
    }
  }

  // To remove selected hierarchy from tails tag
  removeSelectedHierarchy(id: string) {
    // Checkbox removal
    let ref: any = document.getElementById(id);
    if(ref)
      ref.click();
    // Tag removal
    this.hierarchyListTags = this.hierarchyListTags.filter(node => node.id !== id);
    this.treeViewItems.forEach((node: TreeviewItem) => {
      node.correctChecked();
    });
    this.rule_Obj.hierarchy = this.hierarchyListTags;
    return;
  }

  // As per API responce get depth of child hierarchy data
  public getparent(p) {
    if (p.parent) {
      this.getparent(p.parent)
    }
    if (p.item.internalChecked && !p.item.internalChildren.filter(f => f.internalChecked == false).length) {
      this.hierarchy.push(p.item.value)
    }
  }

  // created common array formate to ittrate a loop on all(Perent/child) hierarchy.
  public buildarray(hie) {
    for (var i = 0; i < hie.length; i++) {
      if (hie[i].parent) {
        this.getparent(hie[i].parent)
      }
      if (hie[i].item.internalChecked) {
        this.hierarchy.push(hie[i].item.value)
      }
    }
  }

  // Map hierarchy Ids and push selected ids in hierarchyListTags.
  observeSelectedChange(selectionNodes: Array <string>) {
    this.hierarchy = []
    this.buildarray(selectionNodes)
    this.hierarchy =  [... new Set(this.hierarchy)];
    selectionNodes = this.hierarchy;
    this.hierarchyListTags = [];
    selectionNodes.forEach((node: string) => {
      this.hierarchyListTags.push({
        id: node,
        name: this.hierarchyMap.get(node)
      });
    });
    return;
  }

  // Get program hierarchy list
  loadHierarchies() {
    this.progServ.get(`/configurator/programs/${this.programDetails?.id}/hierarchy?active=true`).subscribe((data:any) => {
      if (data) {
        data.result.forEach(element => {
          let preOrderList = [];
          this.treeViewItems = [];
          this.treeViewGeneric = [];
          if(data.result && data.result.length && data.result[0].hierarchies) {
            data.result[0].hierarchies.forEach(node => {
              this.treeViewGeneric.push(this.treeViewParser(node, preOrderList));
            });
            this.treeViewItems = [];
            this.treeViewItems = this.treeViewGeneric.map(node => new TreeviewItem(node));
          }
          setTimeout(()=> {
            // Initialize listeners
            this.initCheckListeners(preOrderList);
            if(this.isEditMode) {
              this.selectEditItems();
            }
          }, 8000);
        });
      }
    })
  }

  // Get globle operator list for internal purpose use
  loadOperators(): void {
    this.progServ.get(`/rule-engine/operators`).subscribe({
      next: (data: any) => {
        this.operatorList = data.fieldOperators
        this.and_operator_id = this.operatorList?.filter(x => x?.sign === 'AND')[0]?.id;
        this.or_operator_id = this.operatorList?.filter(x => x?.sign === 'OR')[0]?.id;
        this.open_bracket_id = this.operatorList?.filter(x => x?.sign === '(')[0]?.id;
        this.close_bracket_id = this.operatorList?.filter(x => x?.sign === ')')[0]?.id;
        this.without_open_close_bracket_list = this.operatorList?.filter(x => (x?.sign !== '(' && x?.sign !== ')' && x?.sign !== 'AND' && x?.sign !== 'OR'));
      },
      error: err => {
        this._alert.error(err.error?.error?.message ? err.error?.error?.message :  err.error?.message, {})
        console.error(err);
      }
    });
  }

  getUpdatedRuleLogicData(ruleLogic) {
    this.ruleLogicData = ruleLogic
  }

  // Detect changes while changing fields module/ Event / Hierarchy
  dataChange(event, modelName): void {
    if (modelName === 'module') {
      this.showRule = false
      this.rule_Obj.eventId = null
      this.ruleField = []
      this.eventList = []
      this.condition_group.rootCondition = []
      this.rule_Obj.module_code = this.moduleList.filter(x => x.id == this.rule_Obj.moduleId)[0]?.code
      this.loadEvents();
    }
    if (modelName === 'event') {
      this.showRule = false
      this.ruleField = []
      this.condition_group.rootCondition = []
      this.loadFields();
    }
    if (modelName === 'hierarchy') {
      this.rule_Obj[modelName] = event;
    }
  }

  // Pick up event data while starting dragging
  onDragStart(index: number) {
    this.dragStartIndex = index;
  }

  // Will setup and arrange all data at time of dropping
  onDrop(event: DndDropEvent,outerIndex) {
    if (event.data && typeof event.index !== undefined) {
      if (this.dragStartIndex >= 0) {
        let dropIndex = event.index;
        if (dropIndex > this.dragStartIndex) {
          dropIndex--;
        }
        if (dropIndex !== this.dragStartIndex && dropIndex >= 0) {
          this.condition_group[outerIndex].inner_condition.splice(this.dragStartIndex, 1);
          this.condition_group[outerIndex].inner_condition.splice(dropIndex, 0, event.data);
          let tempdata = this.condition_group[outerIndex].inner_condition

          setTimeout(() => {
            this.condition_group[outerIndex].inner_condition = tempdata
          }, 200);

        }
      }
    }
    this.dragStartIndex = null
  }

  // Will get an event while changing inner part of define condition part
  onInnerDataChange(event, moduleName, levelIndex?) {
    if(moduleName == "condition_group") {
      if(this.condition_group.rootCondition[event.outerIndex]) {
        this.condition_group.rootCondition[event.outerIndex].inner_condition = event;
      }
    }
  }

  // Remove outer group of condition
  outerRemoveGroup(outerIndex) {
    this.condition_group.rootCondition.splice(outerIndex+1,1)
  }

  // Provide array of condition and it will return back data as per payload formate
  convertJsonToArrayCondition(condition_group, moduleName?) {
    let placement_order0 = []
    let placementCount = 0
    let indentCount = 0
    let raisError = false
    let raiseLevelError = false
    let errorMessage = ''
    for(let i=0; i < condition_group.length; i++) {
      if(!condition_group[i].inner_condition[0].selectedProperty && i > 0) {
        raisError = true
        raiseLevelError = true
        errorMessage = 'Property'
        condition_group[i].inner_condition[0].propertyError = 1
      }

      if((condition_group.length > 1 || condition_group[i].inner_condition.length > 1) && (!condition_group[0].inner_condition[0].selectedProperty || condition_group[0].inner_condition[0].selectedProperty == null)) {
        raisError = true
        raiseLevelError = true
        errorMessage = 'Property'
        condition_group[0].inner_condition[0].propertyError = 1
      }

      if(condition_group[i].inner_condition[0].selectedProperty || condition_group[i].inner_condition[0].selectedProperty != null) {
        // Initial starting brackets
        placement_order0.push({
          placementOrder : placementCount == 0 ? 0 : ++placementCount,
          indent : indentCount,
          fieldOperatorId : this.open_bracket_id,
        })

        indentCount++;
        for(let j=0; j < condition_group[i].inner_condition.length; j++) {

          // Validation start
          if((condition_group[i].inner_condition[j].fieldType == 'BOOL' && condition_group[i].inner_condition[j].selectedValue==null) || (condition_group[i].inner_condition[j].fieldType != 'BOOL' && !condition_group[i].inner_condition[j].selectedValue) || (Array.isArray(condition_group[i].inner_condition[j].selectedValue) && !condition_group[i].inner_condition[j].selectedValue.length)) {
            raisError = true
            raiseLevelError = true
            errorMessage = 'Value'
            condition_group[i].inner_condition[j].valueError = 1
          }

          if(!condition_group[i].inner_condition[j].selectedOperator) {
            raisError = true
            raiseLevelError = true
            errorMessage = 'Operator'
            condition_group[i].inner_condition[j].operatorError = 1
          }

          if(condition_group[i].inner_condition[j].sourceFieldMeta) {
            condition_group[i].inner_condition[j].selectedCustomField = condition_group[i].inner_condition[j].sourceFieldMeta
          }

          if(condition_group[i].inner_condition[j].selectedCustomField) {
            condition_group[i].inner_condition[j].sourceFieldMeta = condition_group[i].inner_condition[j].selectedCustomField
          }

          if(condition_group[i].inner_condition[j].nest_value && (!condition_group[i].inner_condition[j].sourceFieldMeta || !condition_group[i].inner_condition[j].selectedCustomField)) {
            raisError = true
            raiseLevelError = true
            errorMessage = 'CustomField / Master Data'
            condition_group[i].inner_condition[j].customFieldError = 1
          }

          if(!condition_group[i].inner_condition[j].selectedProperty) {
            raisError = true
            raiseLevelError = true
            errorMessage = 'Property'
            condition_group[i].inner_condition[j].propertyError = 1
          }
          // Validaion ends

          // Initial starting brackets
          placement_order0.push({
            placementOrder : ++placementCount,
            indent : indentCount,
            fieldOperatorId : this.open_bracket_id,
          })

          indentCount++
          //actual conditions
          placement_order0.push(condition_group[i].inner_condition[j].nest_value ? {
            placementOrder: ++placementCount,
            indent: indentCount,
            fieldConfigId: condition_group[i].inner_condition[j].selectedProperty,
            fieldOperatorId: condition_group[i].inner_condition[j].selectedOperator,
            sourceFieldMeta: {
              selectedItem : condition_group[i].inner_condition[j].sourceFieldMeta ? condition_group[i].inner_condition[j].sourceFieldMeta : condition_group[i].inner_condition[j]?.selectedCustomField
            },
            targetFieldValue: {values : Array.isArray(condition_group[i].inner_condition[j].selectedValue) ? condition_group[i].inner_condition[j].selectedValue : [condition_group[i].inner_condition[j].selectedValue]},
          } : {
            placementOrder: ++placementCount,
            indent: indentCount,
            fieldConfigId: condition_group[i].inner_condition[j].selectedProperty,
            fieldOperatorId: condition_group[i].inner_condition[j].selectedOperator,
            targetFieldValue: {values : Array.isArray(condition_group[i].inner_condition[j].selectedValue) ? condition_group[i].inner_condition[j].selectedValue : [condition_group[i].inner_condition[j].selectedValue]},
          })

          indentCount--
          // Initial closing brackets
          placement_order0.push({
            placementOrder : ++placementCount,
            indent : indentCount,
            fieldOperatorId : this.close_bracket_id,
          })

          // Check for outer AND / OR  Needed, If Needed then need to push condition here
          if(j < condition_group[i].inner_condition.length - 1) {
            placement_order0.push({
              placementOrder : ++placementCount,
              indent: indentCount,
              fieldOperatorId: condition_group[i].inner_condition[j].innerisANDSelected ? this.and_operator_id : this.or_operator_id,
            })
          }
        }

        indentCount--
        // Initial closing brackets
        placement_order0.push({
          placementOrder : ++placementCount,
          indent : indentCount,
          fieldOperatorId : this.close_bracket_id,
        })

        // Check for outer AND / OR  Needed, If Needed then need to push condition here
        if(i < condition_group.length - 1) {
          placement_order0.push({
            placementOrder: ++placementCount,
            indent: indentCount,
            fieldOperatorId: condition_group[i].isANDSelected ? this.and_operator_id : this.or_operator_id,
          })
        }
      }
    }
    return raisError ? [{raisError : raisError, errorMessage: errorMessage, raiseLevelError : raiseLevelError}] : placement_order0;
  }

  // Create payload and hit create rule API
  createRule() {
    this.rule_Obj.hierarchy = this.hierarchyListTags.map(x => x.id)
    let removedHierarchy = this.initialSelectedHierarchy.filter(x => !this.rule_Obj.hierarchy.includes(x))
    let newHierarchy = []

    this.rule_Obj.hierarchy.forEach((item, i, a)=> {
      newHierarchy.push({id:a[i],status:true});
    });
    removedHierarchy.forEach((item, i, a)=> {
      newHierarchy.push({id:a[i],status:false});
    });

    // Payload creation
    let payload = {
      ruleName: this.rule_Obj.ruleName,
      programId :this.programDetails.id,
      eventSlug : this.eventList.filter(f => f.id == this.rule_Obj.eventId)[0].slug,
      eventId: this.rule_Obj.eventId,
      ruleType: this.rule_Obj.ruleType,
      hierarchies: newHierarchy,
      moduleId: this.rule_Obj.moduleId,
      enabled : this.newRule.value,
      initialTriggerCondition : [{'placement_order':0,'conditions':[],'recipient_types':[]}],
      conditions : this.ruleLogicData.input_condition,
      actions : this.ruleLogicData.output_condition,
      effectiveStartDate:this.localDateFormat.transform(this.rule_Obj.effectiveStartDate, DATE_FORMAT.FORMATYMD, null, null, true, this.dateFormat),
      effectiveEndDate:this.rule_Obj.effectiveEndDate ? this.localDateFormat.transform(this.rule_Obj.effectiveEndDate, DATE_FORMAT.FORMATYMD, null, null, true, this.dateFormat) : ''
    };

    // Push Define condition at 0 index of payload
    if(this.convertJsonToArrayCondition(this.condition_group.rootCondition, "condition")[0]?.raisError) {
      this._alert.error("Please fill "+ this.convertJsonToArrayCondition(this.condition_group.rootCondition, "condition")[0]?.errorMessage +" in initial trigger data",{});
      return;
    }

    payload.initialTriggerCondition = this.convertJsonToArrayCondition(this.condition_group.rootCondition, "condition")
    // Delete condition if condition is blank
    if(!payload.initialTriggerCondition || !payload.initialTriggerCondition?.length || payload.initialTriggerCondition?.length == 0) {
      delete payload.initialTriggerCondition
    }

    // Validations for Rule Logic
    if(this.ruleLogicData.input_condition.filter(input => input.fieldConfigId == null || input.fieldOperatorId == null).length > 0 ||
      this.ruleLogicData.output_condition.filter(output => output.fieldConfigId == null).length > 0) {
      this._alert.error("Please fill required data in Rule Logic",{});
      return;
    }

    // Calling post / put API based on rule_id
    this.rule_id ? this.progServ.put(`/configurator/programs/${this.programDetails?.id}/rule-configs/${this.rule_id}`, payload).subscribe(
      data => {
        if(data) {
          this._alert.success('Rule config updated successfully.')
          this.Router.navigate(['program', 'rules-builder','list']);
        }
      },
      err => {
        this._alert.error(err.error?.error?.message ? err.error?.error?.message :  err.error?.message, {})
        console.error(err);
      }
    ) : this.progServ.post(`/rule-engine/generate-decision-table`, payload).subscribe(
      (data:any) => {
        if(data) {
          this._alert.success('Rule config created successfully.')
          this.Router.navigate(['program', 'rules-builder', 'view', data.ruleId]);
        }
      },
      err => {
        this._alert.error(err.error?.error?.message ? err.error?.error?.message :  err.error?.message, {})
        console.error(err);
      }
    )
  }

  showHideFullText() {
    this.textVisibility = !this.textVisibility;
    if(this.linkText === "View more") {
      this.linkText = "View less"
    }
    else if(this.linkText === "View less") {
      this.linkText = "View more"
    }
  }

  showHideFullLevelText(level) {
    if(level) {
      level.active = !level.active
    }
  }
}
