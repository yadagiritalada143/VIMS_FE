import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
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

@Component({
  selector: 'app-new-flow',
  templateUrl: './new-flow.component.html',
  styleUrls: ['./new-flow.component.scss'],
  providers: [{
    provide: TreeviewI18n,
    useClass: DropdownTreeviewSelectI18n
  },
  {
    provide: TreeviewEventParser,
    useClass: DownlineTreeviewEventParser
  }],
})
export class NewFlowComponent implements OnInit {
  public newFlow = {
    title: 'Active',
    value: true,
    name: 'active',
  };
  showSkipLevelInModules=["JOBS","OFFERS","ASSIGNMENTS"]
  recipientsData: any =[];
  flow_Obj : any = [];
  propertyList :any = []
  operatorList : any = []
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
  skipLevelIfActorOnlyApproverInLevel : boolean = false;
  bypassDuplicateApprover : boolean = false;
  programDetails: any = {};
  and_operator_id : any;
  or_operator_id : any;
  open_bracket_id : any;
  flow_id = '';
  close_bracket_id : any;
  without_open_close_bracket_list : any = [];
  allSelectedRecipientsData : any = []
  private dragStartIndex: number;
  initialSelectedHierarchy : any = []
  flowMethodsList = [];

  public hierarchy = [];
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
  linkText: string = "View More";
  textVisibility: boolean = false;

  constructor (
    private Router : SvmsRouterService,
    private _alert: AlertService,
    private activatedRoute: ActivatedRoute,
    private progServ: ProgramSetupService,
    private storeServ: StorageService,
    private sortPipe: SortHelperPipe,
    private location: Location
  ) {
    this.programDetails = this.storeServ.get(StorageKeys.CURRENT_PROGRAM);
  }

  ngOnInit(): void {
    this.loadModules();
    this.loadHierarchies();
    this.flow_id = this.activatedRoute.snapshot.params['id'];
    this.flow_Obj.event_id = this.activatedRoute.snapshot.params['eventId'];
    this.flow_Obj.module = this.activatedRoute.snapshot.params['moduleId'];
    this.flow_Obj.flow_type = this.activatedRoute.snapshot.params['flow_type'];
    this.loadOperators();
    if(this.flow_Obj?.event_id && this.flow_Obj?.module) {
      this.dataChange('','event')
    }
    this.flow_Obj.flow_type = this.activatedRoute.snapshot.params['flow_type'];
    if(this.flow_Obj?.event_id && this.flow_Obj?.module && this.flow_Obj?.flow_type) {
      this.dataChange('','flow_type')
    }
    if (this.flow_id) {
      this.isEditMode = true
      this.getFlowConfigDetail()
    }

  }

  toggleCondition(level) {
    level.showCondition = !level.showCondition;
  }

  // Go back to listing page
  backToPage() {
    this.location.back();
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

  // To add new Define Condition group in level part
  addLevelOuterCondition(levelIndex) {
    this.level_group.rootLevel[levelIndex].levelConditions.push({
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

  // To add a new level
  addLevel() {
    this.level_group.rootLevel.push({
      levelConditions : [{
        inner_condition : [{
          selectedProperty : null,
          selectedOperator : null,
          selectedValue:null,
          innerisANDSelected : true,
          inner_condition : []
        }],
        isANDSelected : false
      }],
      recipients : {},
      showCondition:false
    })
  }

  // remove indent group of define condition
  removeInnerOuterGroup(event) {
    // this.condition_group.rootCondition?.innerConditionGroup[event.innerConditionInnerIndex].splice(event.outerIndex+1,1)
    this.condition_group.rootCondition[event.outerIndex].inner_condition.splice(event.innerConditionInnerIndex,1)
  }

  // To remove level
  removeLevel(levelIndex) {
    this.level_group.rootLevel.splice(levelIndex,1)
    this.allSelectedRecipientsData = this.level_group.rootLevel.map(x => x.selectedrecipients)?.filter(r => !r.canBeMultiple)?.map(y => y.recipient_type_id)
  }

  // Get changes of Recipient component
  onRecipientLevelDataChange(recipientData,levelIndex) {
    this.level_group.rootLevel[levelIndex].selectedrecipients = recipientData
    this.allSelectedRecipientsData = this.level_group?.rootLevel?.map(x => x?.selectedrecipients)?.filter(r => !r.canBeMultiple)?.map(y => y?.recipient_type_id)
  }

  // To Active/Inactive flow
  onClickToggleFlow() {
    if (this.newFlow.value) {
      this.newFlow.value = false;
      this.newFlow.title = "Inactive";
    }
    else {
      this.newFlow.value = true;
      this.newFlow.title = "Active";
    }
  }

  // Call detail API to get bind values
  getFlowConfigDetail() {
    this.progServ.get(`/configurator/programs/${this.programDetails.id}/flow-configs/${this.flow_id}`).subscribe({
      next: (data: any) => {
        if(data?.flow_config) {
          this.loadFlowConfigData(data?.flow_config)
        }
      },
      error: err => {
        console.error(err);
      }
    });
  }

  // Auto bind field of flow confing at edit / view mode
  loadFlowConfigData(flowConfigObj) {
    this.flow_Obj.module = flowConfigObj?.module.id;
    this.flow_Obj.name = flowConfigObj?.name;
    this.flow_Obj.event_id = flowConfigObj?.event.id;
    this.flow_Obj.flow_type = flowConfigObj?.flow_type;
    this.flow_Obj.module_code = this.moduleList.filter(x => x.id == this.flow_Obj.module)[0]?.code
    this.skipLevelIfActorOnlyApproverInLevel = flowConfigObj?.config?.skip_level_if_actor_is_only_approver_in_level ? flowConfigObj?.config?.skip_level_if_actor_is_only_approver_in_level : false
    this.bypassDuplicateApprover = flowConfigObj?.config?.bypass_duplicate_approver ? flowConfigObj?.config?.bypass_duplicate_approver : false
    this.loadEvents();
    this.loadFields();
    this.loadMethodsList();
    this.getrecipientData();
    this.newFlow.value = flowConfigObj?.is_enabled,
    this.flow_Obj.hierarchy = flowConfigObj?.hierarchies?.map(x => x.id);
    this.initialSelectedHierarchy = flowConfigObj?.hierarchies?.map(x => x.id);
    let define_condition = flowConfigObj.levels.filter(x => x.placement_order == 0)[0]
    if(define_condition?.conditions?.length) {
      this.condition_group.rootCondition = this.getArrangedCondition(define_condition?.conditions);
    }

    let levels =  flowConfigObj.levels.filter(x => x.placement_order != 0)


    for(let i=0; i<levels.length; i++ ) {
      let key = Object.keys(levels[i].recipient_types[0].metadata)

      let meta_data = []
      for(let j=0; j<key.length ; j++) {
        meta_data.push({
          selectedkey : key[j],
          selectedvalue : Array.isArray(levels[i].recipient_types[0].metadata[key[j]].input_value) ? levels[i].recipient_types[0].metadata[key[j]].input_value[0].id : levels[i].recipient_types[0].metadata[key[j]].input_value,
          searchableName : Array.isArray(levels[i].recipient_types[0].metadata[key[j]].input_value) ? levels[i].recipient_types[0].metadata[key[j]].input_value[0].name : '',
          input_value : levels[i].recipient_types[0].metadata[key[j]].input_value,
          render_children_as_dropdown : Array.isArray(levels[i].recipient_types[0].metadata[key[j]].input_value) ? levels[i].recipient_types[0].metadata[key[j]].config?.render_children_as_dropdown : false
        })
      }
      this.level_group.rootLevel.push({
        levelConditions : this.getArrangedCondition(levels[i].conditions),
        recipients : {
          recipient_type : levels[i].recipient_types[0].recipient_type.id,
          meta_data : meta_data,
          behaviour : levels[i].recipient_types[0].behaviour
        },
        showCondition:true
      })
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

      if(conditions[i].indent == 0 && conditions[i].field_operator.id == this.open_bracket_id) {
        rootCondition.push({
          inner_condition : [],
          isANDSelected : conditions[i].field_operator.id == this.and_operator_id ? true : false
        })
      }

      if(conditions[i].field_operator.is_seperator && conditions[i].field_operator.id != this.open_bracket_id && conditions[i].field_operator.id != this.close_bracket_id && conditions[i].indent == 0) {

      }

      if(conditions[i].indent == 1 && conditions[i].field_operator.is_seperator && (conditions[i].field_operator.id == this.and_operator_id || conditions[i].field_operator.id == this.or_operator_id )) {
        rootCondition[rootIndex].inner_condition[innerIndex].innerisANDSelected = conditions[i].field_operator.id == this.and_operator_id ? true : false;
        innerIndex++;
      }

      if(conditions[i].indent == 2 && conditions[i].field_config && conditions[i].target_field_value?.values.length && conditions[i].field_operator) {
        rootCondition[rootIndex]?.inner_condition.push(conditions[i].field_config.config.nest_value ? {
          selectedProperty : conditions[i].field_config.id,
          selectedOperator : conditions[i].field_operator.id,
          propertySlug : conditions[i].field_config.slug,
          selectedCustomField : conditions[i].source_field_meta?.id,
          fieldType:conditions[i]?.field_config?.children ? conditions[i]?.field_config?.children[0]?.field?.field_type :"",
          nestSearchableName : conditions[i].target_field_obj ? conditions[i].target_field_obj[0]?.name : conditions[i].target_field_obj,
          target_field_obj : conditions[i].target_field_obj ? conditions[i].target_field_obj : null,
          selectedValue: conditions[i].field_config?.config?.multiselect ? conditions[i].target_field_value.values : conditions[i].target_field_value.values[0],
          target_field_value : conditions[i].target_field_value.values,
          // isValueMultiselected : conditions[i].field_config?.config?.multiselect ? true : false
        } : {
          selectedProperty : conditions[i].field_config.id,
          selectedOperator : conditions[i].field_operator.id,
          fieldType: conditions[i]?.field_config?.field?.field_type,
          searchableName : conditions[i].target_field_obj ? conditions[i].target_field_obj[0]?.name : conditions[i].target_field_obj,
          target_field_obj: conditions[i].target_field_obj ? conditions[i].target_field_obj : null,
          selectedValue: conditions[i].field_config?.config?.multiselect ? conditions[i].target_field_value.values : conditions[i].target_field_value.values[0],
        })
      }
      if(conditions[i].indent == 0 && (conditions[i].field_operator.id == this.and_operator_id || conditions[i].field_operator.id == this.or_operator_id )) {
          rootCondition[rootIndex].isANDSelected = conditions[i].field_operator.id == this.and_operator_id ? true : false;
          rootIndex++;
          innerIndex= 0;
      }

    }
    return rootCondition;
  }

  // Get property list based on module and event selection
  loadFields(): void {
    if (this.flow_Obj.module && this.flow_Obj.event_id) {
      this.progServ.get(`/configurator/flow-system/modules/${this.flow_Obj.module}/events/${this.flow_Obj.event_id}/schema`).subscribe({
        next: (data: any) => {
          this.propertyList = data.event_schema.field_configs
        },
        error: err => {
          console.error(err);
        }
      });
    } else {
      this.propertyList = [];
    }
  }

  // Get module list
  loadModules(term?): void {
    let url = `/configurator/programs/${this.programDetails?.id}/modules?exclude_if_no_event=true`
    term ? url = url + `&k=${term.term}` : url
    this.progServ.get(url).subscribe({
      next: (data: any) => {
        this.moduleList = this.sortPipe.transform(data?.modules, 'name');
        if(this.flow_Obj.module){
          this.flow_Obj.module_code = this.moduleList.filter(x => x.id == this.flow_Obj.module)[0]?.code
        }
        this.loadEvents();
      },
      error: err => {
        console.error(err);
      }
    });
  }

  // Get event list based on module selection
  loadEvents(): void {
    if (this.flow_Obj?.module) {
      this.progServ.get(`/configurator/flow-system/modules/${this.flow_Obj?.module}/events`).subscribe({
        next: (data: any) => {
          this.eventList = this.sortPipe.transform(data?.events, 'name');
          // this.flow_Obj.event_id = "4dfbb31e-a342-4cc8-8102-75818ed5d93b";
        },
        error: err => {
          console.error(err);
          // this.eventList = [{id: 1, name : "Event 1"}, {id: 1, name : "Event 2"}]
        }
      });
    } else {
      this.eventList = [];
    }
  }

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
    if(this.flow_Obj.hierarchy) {
      let list: Array <string> = this.flow_Obj.hierarchy;
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
    this.flow_Obj.hierarchy = this.hierarchyListTags;
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
          }, 1000);
        });
      }
    })
  }
  onClickSkipLevelIfActorOnlyApprover() {
    if (this.skipLevelIfActorOnlyApproverInLevel) {
      this.skipLevelIfActorOnlyApproverInLevel = false;
    } else {
      this.skipLevelIfActorOnlyApproverInLevel = true;
    }
  }

  onClickbypassDuplicateApprover() {
    if (this.bypassDuplicateApprover) {
      this.bypassDuplicateApprover = false;
    } else {
      this.bypassDuplicateApprover = true;
    }
  }
  // Get globle operator list for internal purpose use
  loadOperators(): void {
    this.progServ.get(`/configurator/flow-system/field-operators`).subscribe({
      next: (data: any) => {
        this.operatorList = this.sortPipe.transform(data?.field_operators, 'sign');
        this.and_operator_id = this.operatorList?.filter(x => x?.sign === 'AND')[0]?.id;
        this.or_operator_id = this.operatorList?.filter(x => x?.sign === 'OR')[0]?.id;
        this.open_bracket_id = this.operatorList?.filter(x => x?.sign === '(')[0]?.id;
        this.close_bracket_id = this.operatorList?.filter(x => x?.sign === ')')[0]?.id;
        this.without_open_close_bracket_list = this.operatorList?.filter(x => (x?.sign !== '(' && x?.sign !== ')' && x?.sign !== 'AND' && x?.sign !== 'OR'));
      },
      error: err => {
        console.error(err);
      }
    });
  }

  // Get data for recipient form
  getrecipientData() {
    if (this.flow_Obj.module && this.flow_Obj.event_id && this.flow_Obj.flow_type) {

      this.progServ.get(`/configurator/flow-system/modules/${this.flow_Obj.module}/events/${this.flow_Obj.event_id}/methods/${this.flow_Obj.flow_type}/recipient-types`).subscribe({
        next: (data: any) => {
          this.recipientsData = this.sortPipe.transform(data.recipient_types, 'name');
          this.recipientsData.forEach(rec => {
            rec.canBeMultiple = rec.metadata?.allow_in_multiple_levels || false
            if(rec.metadata.module_specific_actions && rec.metadata.module_specific_actions[this.flow_Obj.module_code]?.display_name) {
              rec.name = rec.metadata.module_specific_actions[this.flow_Obj.module_code]?.display_name
            }
          })
        },
        error: err => {
          console.error(err);
        }
      });
    }
  }

  loadMethodsList() {
    if (this.flow_Obj.module && this.flow_Obj.event_id) {
      this.progServ.get(`/configurator/flow-system/modules/${this.flow_Obj.module}/events/${this.flow_Obj.event_id}/methods`).subscribe({
        next: (data: any) => {
          this.flowMethodsList = data.methods
        },
        error: err => {
          console.error(err);
        }
      });
    }
  }

  // Detect changes while changing fields module/ Event / Hierarchy
  dataChange(event, modelName): void {
    if (modelName === 'module') {
      this.flow_Obj.event_id = null
      this.flow_Obj.flow_type = null
      this.level_group.rootLevel = []
      this.condition_group.rootCondition = []
      this.allSelectedRecipientsData = []
      this.propertyList = []
      this.recipientsData = []
      this.flow_Obj.module_code = this.moduleList.filter(x => x.id == this.flow_Obj.module)[0]?.code
      this.loadEvents();
      // this.flow_Obj.event_id = null
    }
    if (modelName === 'event') {
      this.flow_Obj.flow_type = null
      this.level_group.rootLevel = []
      this.condition_group.rootCondition = []
      this.allSelectedRecipientsData = []
      this.recipientsData = []
      this.propertyList = []
      this.loadMethodsList();
      this.loadFields();
    }
    if (modelName === 'flow_type' && this.flow_Obj?.flow_type) {
      this.getrecipientData();
      if (!this.flow_id && !this.level_group?.rootLevel?.length) {
        this.addLevel()
      }
    }
    if (modelName === 'hierarchy') {
      this.flow_Obj[modelName] = event;
    }
    if(!this.flow_Obj?.module || !this.flow_Obj?.event_id || !this.flow_Obj?.flow_type) {
      this.level_group.rootLevel = []
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
    if(moduleName == "level_group") {
      if(this.level_group.rootLevel[levelIndex].levelConditions[event.outerIndex]) {
        this.level_group.rootLevel[levelIndex].levelConditions[event.outerIndex].inner_condition = event;
      }
    }
  }

  // Get an event while changing data on Level part
  onLevelDataChange(event) {
    this.level_group.rootLevel[event.levelIndex] = event
  }

  // Remove outer part of define condition in level part
  removeLevelOuterGroup(outerIndex,levelIndex) {
    // this.level_group.rootLevel[levelIndex].levelConditions.splice(outerIndex+1,1)
  }

  // Remove Indent group from level condition
  removeLevelInnerOuterGroup(event,levelIndex) {
    // this.condition_group.rootCondition[event.outerIndex].innerConditionGroup.splice(event.innerConditionInnerIndex,1)
    this.level_group.rootLevel[levelIndex].levelConditions[event.outerIndex].inner_condition.splice(event.innerConditionInnerIndex,1)
  }

  // Remove outer group of condition
  outerRemoveGroup(outerIndex) {
    this.condition_group.rootCondition.splice(outerIndex+1,1)
  }

  outerLevelRemoveGroup(level,levelIndex, outerIndex) {
    this.level_group.rootLevel[levelIndex].levelConditions = [{
      inner_condition : [{
        selectedProperty : null,
        selectedOperator : null,
        selectedValue:null,
        innerisANDSelected : true,
        inner_condition : []
      }],
      isANDSelected : false
    }]
    level.showCondition = false
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
          placement_order : placementCount == 0 ? 0 : ++placementCount,
          indent : indentCount,
          field_operator_id : this.open_bracket_id,
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

          if(condition_group[i].inner_condition[j].source_field_meta) {
            condition_group[i].inner_condition[j].selectedCustomField = condition_group[i].inner_condition[j].source_field_meta
          }

          if(condition_group[i].inner_condition[j].selectedCustomField) {
            condition_group[i].inner_condition[j].source_field_meta = condition_group[i].inner_condition[j].selectedCustomField
          }

          if(condition_group[i].inner_condition[j].nest_value && (!condition_group[i].inner_condition[j].source_field_meta || !condition_group[i].inner_condition[j].selectedCustomField)) {
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
            placement_order : ++placementCount,
            indent : indentCount,
            field_operator_id : this.open_bracket_id,
          })

          indentCount++
          //actual conditions
          placement_order0.push(condition_group[i].inner_condition[j].nest_value ? {
            placement_order: ++placementCount,
            indent: indentCount,
            field_config: condition_group[i].inner_condition[j].selectedProperty,
            field_operator_id: condition_group[i].inner_condition[j].selectedOperator,
            source_field_meta: {
              selected_item : condition_group[i].inner_condition[j].source_field_meta ? condition_group[i].inner_condition[j].source_field_meta : condition_group[i].inner_condition[j]?.selectedCustomField
            },
            target_field_value: {values : Array.isArray(condition_group[i].inner_condition[j].selectedValue) ? condition_group[i].inner_condition[j].selectedValue : [condition_group[i].inner_condition[j].selectedValue]},
          } : {
            placement_order: ++placementCount,
            indent: indentCount,
            field_config: condition_group[i].inner_condition[j].selectedProperty,
            field_operator_id: condition_group[i].inner_condition[j].selectedOperator,
            target_field_value: {values : Array.isArray(condition_group[i].inner_condition[j].selectedValue) ? condition_group[i].inner_condition[j].selectedValue : [condition_group[i].inner_condition[j].selectedValue]},
          })

          indentCount--
          // Initial closing brackets
          placement_order0.push({
            placement_order : ++placementCount,
            indent : indentCount,
            field_operator_id : this.close_bracket_id,
          })

          // Check for outer AND / OR  Needed, If Needed then need to push condition here
          if(j < condition_group[i].inner_condition.length - 1) {
            placement_order0.push({
              placement_order : ++placementCount,
              indent: indentCount,
              field_operator_id: condition_group[i].inner_condition[j].innerisANDSelected ? this.and_operator_id : this.or_operator_id,
            })
          }
        }

        indentCount--
        // Initial closing brackets
        placement_order0.push({
          placement_order : ++placementCount,
          indent : indentCount,
          field_operator_id : this.close_bracket_id,
        })

        // Check for outer AND / OR  Needed, If Needed then need to push condition here
        if(i < condition_group.length - 1) {
          placement_order0.push({
            placement_order: ++placementCount,
            indent: indentCount,
            field_operator_id: condition_group[i].isANDSelected ? this.and_operator_id : this.or_operator_id,
          })
        }
      }
    }
    return raisError ? [{raisError : raisError, errorMessage: errorMessage, raiseLevelError : raiseLevelError}] : placement_order0;
  }

  // Create payload and hit create flow API
  createFlow() {
    this.flow_Obj.hierarchy = this.hierarchyListTags.map(x => x.id)
    let removedHierarchy = this.initialSelectedHierarchy.filter(x => !this.flow_Obj.hierarchy.includes(x))
    let newHierarchy = []

    this.flow_Obj.hierarchy.forEach((item, i, a)=> { const p = new Object();
      p[a[i]] = true;
      newHierarchy.push(p);
    });
    removedHierarchy.forEach((item, i, a)=> { const p = new Object();
      p[a[i]] = false;
      newHierarchy.push(p);
    });

    // Payload creation
    let payload = {
      name: this.flow_Obj.name,
      event_id: this.flow_Obj.event_id,
      flow_type: this.flow_Obj.flow_type,
      hierarchies: newHierarchy,
      placement_order: 0,
      module: this.flow_Obj.module,
      config:{
        skip_level_if_actor_is_only_approver_in_level : this.skipLevelIfActorOnlyApproverInLevel,
        bypass_duplicate_approver : this.bypassDuplicateApprover
      },
      is_enabled : this.newFlow.value,
      levels : [{'placement_order':0,'conditions':[],'recipient_types':[]}]
    };
    if(!this.showSkipLevelInModules.includes(this.flow_Obj.module_code))
    {
      delete payload.config?.skip_level_if_actor_is_only_approver_in_level
    }

    // Push Define condition at 0 index of payload
    if(this.convertJsonToArrayCondition(this.condition_group.rootCondition, "condition")[0]?.raisError) {
      this._alert.error("Please fill "+ this.convertJsonToArrayCondition(this.condition_group.rootCondition, "condition")[0]?.errorMessage +" in initial trigger data",{});
      return;
    }

    payload.levels[0].conditions = this.convertJsonToArrayCondition(this.condition_group.rootCondition, "condition")
    // Delete condition if condition is blank
    if(!payload.levels[0].conditions || !payload.levels[0].conditions?.length || payload.levels[0].conditions?.length == 0) {
      delete payload.levels[0].conditions
    }

    // Adding level will start from 1st index
    for(let i=0; i < this.level_group.rootLevel.length; i++) {
      let levelData = {placement_order:i+1,conditions:[],recipient_types:[]}

      levelData.conditions = this.convertJsonToArrayCondition(this.level_group.rootLevel[i].levelConditions, "level")
      if(this.convertJsonToArrayCondition(this.level_group.rootLevel[i].levelConditions, "level")[0]?.raiseLevelError) {
        this._alert.error("Please fill "+ this.convertJsonToArrayCondition(this.level_group.rootLevel[i].levelConditions, "level")[0]?.errorMessage +" under condition in level "+ (i+1),{});
        return;
      }

      if(!levelData.conditions.length || (levelData.conditions.length == 1 && levelData.conditions[0]?.raisError)) {
        delete levelData.conditions;
      }

      // Add recipients data if we have
      if(this.level_group.rootLevel[i].selectedrecipients && this.level_group.rootLevel[i].selectedrecipients?.recipient_type_id) {
        levelData.recipient_types = [this.level_group.rootLevel[i].selectedrecipients]
      }

      // Attaching level data with patyload
      payload.levels.push(levelData)
    }

    if(payload.levels.length == 1 && payload.levels[0].placement_order == 0 && !payload.levels[0]?.conditions) {
      delete payload.levels
    }

    // Validation for reciepent data type mandotory
    if(payload.levels) {
      for(let i=0; i<payload?.levels.length; i++) {
        if(payload.levels[i].placement_order==0) {
          delete payload.levels[i].recipient_types
        }
        if(payload.levels[i].placement_order != 0 && (!payload.levels[i].recipient_types.length || payload.levels[i].recipient_types.length == 0 || !payload.levels[i]?.recipient_types[0]?.recipient_type_id || payload.levels[i].recipient_types[0].emptyBehaviour)) {
          this._alert.error("Please fill recipent type data in level "+ i,{});
          return true;
        }
        if(payload.levels[i].placement_order != 0) {
          let keys = Object.keys(payload.levels[i]?.recipient_types[0]?.meta_data)
          let showError = []
          keys.forEach(x => {
            if(!payload.levels[i]?.recipient_types[0]?.meta_data[x] && payload.levels[i]?.recipient_types[0]?.meta_data[x]!=0) {
              this._alert.error("Please fill recipent type data in level "+ i,{});
              showError.push(true);
            }
          })
          if(showError.includes(true)) {
            return true;
          }
        }
        if(!payload.levels[i].conditions) {
          delete payload.levels[i].conditions
        }
      }
    }
    for(let i=1; i<payload?.levels?.length; i++) {
      delete payload?.levels[i]?.recipient_types[0]?.canBeMultiple
    }
    // Calling post / put API based on flow_id
    this.flow_id ? this.progServ.put(`/configurator/programs/${this.programDetails?.id}/flow-configs/${this.flow_id}`, payload).subscribe(
      (data: any) => {
        if(data) {
          this._alert.success('Workflow updated successfully.')
          this.Router.navigate([ 'program', 'workflow', 'view', data?.flow_config?.id])
        }
      },
      err => {
        this._alert.error(err.error?.error?.message ? err.error?.error?.message :  err.error, {})
        console.error(err);
      }
    ) : this.progServ.post(`/configurator/programs/${this.programDetails?.id}/flow-configs`, payload).subscribe(
      (data: any) => {
        if(data) {
          this._alert.success('Workflow created successfully.')
          this.Router.navigate([ 'program', 'workflow', 'view', data?.flow_config?.id]);
        }
      },
      err => {
        this._alert.error(err.error?.error?.message ? err.error?.error?.message :  err.error, {})
        console.error(err);
      }
    )
  }

  showHideFullText() {
    this.textVisibility = !this.textVisibility;
    if(this.linkText === "View More") {
      this.linkText = "View Less"
    }
    else if(this.linkText === "View Less") {
      this.linkText = "View More"
    }
  }

  showHideFullLevelText(level) {
    if(level) {
      level.active = !level.active
    }
  }
}
