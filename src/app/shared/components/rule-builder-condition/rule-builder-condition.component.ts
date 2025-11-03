import {Component, OnInit, Input,Output,EventEmitter } from '@angular/core';
import { DndDropEvent } from 'ngx-drag-drop';
import { ProgramSetupService } from 'src/app/program-setup/program-setup.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';

@Component({
  selector: 'app-rule-builder-condition',
  templateUrl: './rule-builder-condition.component.html',
  styleUrls: ['./rule-builder-condition.component.scss']
})
export class RuleBuilderConditionComponent implements OnInit {
  @Input() propertyList;
  @Input() condition;
  @Input() fullcondition
  @Input() outerIndex;
  @Input() outerConditionLength;
  @Input() isEditMode;
  @Input() selectedModuleCode;
  @Input() selectedEvent;
  @Input() currentLevel;
  @Input() totalLevelAllowed;
  @Input() moduleList;
  @Output() removeOuterGroup = new EventEmitter();
  @Output() updatedInnerCondition = new EventEmitter();

  programDetails: any = {};
  event_field_mapping_id = ''
  valueList : any = []
  property_options : any = []
  property_config : any = []
  allSelectedValues : any = []
  valueListLoading : boolean = false;
  private dragStartIndex: number;

  conditionalSubItem: boolean = true;
  public dateFormat;

  constructor(private progServ: ProgramSetupService, private storeServ: StorageService,private sortPipe: SortHelperPipe) {
    this.programDetails = this.storeServ.get(StorageKeys.CURRENT_PROGRAM);
  }

  ngOnInit(): void {
    this.dateFormat = this.programDetails?.defaultDateFormat;
    this.property_options = this.propertyList?.map(x => {
      x.name = x.ruleField.name;
      if(x.config?.nest_value) {
        x.ruleField.nest_value = x.config?.nest_value ? true : false
      }
      if(x.config?.append_path_from_child) {
        x.ruleField.append_path_from_child = true
        if(x.children) {
          x.ruleField.children = x.children[0]
        }
      }
      if(x.config?.display_name){
        x.name =  x.config?.display_name;
        x.ruleField.name = x.config?.display_name
      }
      if(x?.children?.length && x?.children[0]?.config?.display_name){
        x.ruleField.nestValuePlaceholder = x.children[0]?.config?.display_name // Override value of ruleField display name if we have 'x.children[0]?.config?.display_name' this ruleField.
      }
      return x
    })
    this.property_options = this.sortPipe.transform(this.property_options, 'name');
    if(this.isEditMode) {
      this.allSelectedValues = this.condition.inner_condition.map(x => x.selectedValue).flat();
      for(let i=0; i<this.condition.inner_condition.length; i++) {
        const eventData = this.propertyList?.find(x => x?.id === this.condition.inner_condition[i]?.selectedProperty);
        if(eventData) {
          this.getValuesByProperty(eventData, i)
        }
      }
    }
  }

  // Select AND/OR on inner condition part
  toggleCheckbox(innerIndex) {
    if(this.condition['inner_condition'][innerIndex].innerisANDSelected) {
      this.condition['inner_condition'][innerIndex].innerisANDSelected = false;
    }
    else {
      this.condition['inner_condition'][innerIndex].innerisANDSelected = true;
    }
  }

  // Select AND/OR on outer condition part
  toggleConditionalItem() {
    if(this.condition.isANDSelected) {
      this.condition.isANDSelected = false;
    }
    else {
      this.condition.isANDSelected = true;
    }
  }

  // Get event while start dragging properties
  onDragStart(index: number) {
    this.dragStartIndex = index;
  }

  // Get Event while dropping properties
  onDrop(event: DndDropEvent,outerIndex) {
    if (event.data && typeof event.index !== undefined) {
      if (this.dragStartIndex >= 0) {
        let dropIndex = event.index;
        if (dropIndex > this.dragStartIndex) {
          dropIndex--;
        }
        if (dropIndex !== this.dragStartIndex && dropIndex >= 0) {
          this.condition.inner_condition.splice(this.dragStartIndex, 1);
          this.condition.inner_condition.splice(dropIndex, 0, event.data);
          let tempdata = this.condition.inner_condition

          setTimeout(() => {
            this.condition.inner_condition = tempdata
          }, 200);

        }
      }
    }
    this.dragStartIndex = null
  }

  //Add intent group
  addIntentGroup(inner_group){
    inner_group.inner_condition?.push({
      inner_condition:[{
        selectedProperty : null,
        selectedOperator : null,
        selectedValue:null,
        innerisANDSelected : true,
        inner_condition:[]
      }],isANDSelected : true
    })
  }

  // Add inner group of set in condition
  addInnerGroup() {
    this.condition['inner_condition']?.push({
      selectedProperty : null,
      selectedOperator : null,
      selectedValue:null,
      innerisANDSelected : true,
      inner_condition:[]
    })
  }

  // Will get an event while changing inner part of define condition part
  onInnerDataChange(event, moduleName, levelIndex?) {
    if(event) {
      this.updatedInnerCondition.emit(this.condition.inner_condition)
    }
  }

  // Remove inner group of set in condition
  removeInnerGroup(innerIndex) {
    this.condition['inner_condition'].splice(innerIndex,1)
  }

  // Get event on form fields data changes
  onDataChange(event?,moduleName?,outerIndex?,innerIndex?,inner_group?) {
    if(!this.condition.inner_condition[innerIndex]?.selectedValue && moduleName != 'bool') {
      if(this.condition.inner_condition[innerIndex]?.searchableName) {
        this.condition.inner_condition[innerIndex].searchableName = ''
      }
      this.searchValues('',innerIndex,inner_group)
    }
    if(moduleName == 'property') {
      this.condition.inner_condition[innerIndex].propertySlug = event?.slug
      this.condition.inner_condition[innerIndex].selectedCustomField = null
      this.condition.inner_condition[innerIndex].fieldSlug = null
      this.condition.inner_condition[innerIndex].placeHolder = null
      this.condition.inner_condition[innerIndex].source_field_meta = null
      this.condition.inner_condition[innerIndex].nest_value  = event?.config?.nest_value ? true : false
      this.condition.inner_condition[innerIndex].append_path_from_child  = event?.config?.append_path_from_child ? true : false
      this.condition.inner_condition[innerIndex].selectedOperator = null
      this.condition.inner_condition[innerIndex].selectedValue = null
      this.condition.inner_condition[innerIndex].valueError = null
      this.condition.inner_condition[innerIndex].valueList = []
      this.condition.inner_condition[innerIndex].target_field_obj = []
      const eventData = this.propertyList?.find(x => x?.id === event?.id);
      if(eventData) {
        this.getValuesByProperty(eventData, innerIndex)
      }
    }
    if(moduleName == 'customfield') {
      this.condition.inner_condition[innerIndex].selectedOperator = null
      this.condition.inner_condition[innerIndex].selectedValue = null
      this.condition.inner_condition[innerIndex].valueList = null
      this.condition.inner_condition[innerIndex].target_field_obj = []
      if(this.condition.inner_condition[innerIndex].append_path_from_child && this.condition.inner_condition[innerIndex].selectedCustomField) {
        this.condition.inner_condition[innerIndex].source_field_meta = event.id
        const eventData = this.propertyList?.find(x => x?.id === this.condition.inner_condition[innerIndex].selectedProperty);
        if(eventData) {
          if(this.condition.inner_condition[innerIndex]?.nestSearchableName) {
            this.condition.inner_condition[innerIndex].nestSearchableName = null
          }
          this.getFoundationalDataValuesByProperty(eventData, innerIndex)
        }
      } else {
        if(this.condition.inner_condition[innerIndex].selectedCustomField) {
          this.condition.inner_condition[innerIndex].fieldType = event?.type
          this.condition.inner_condition[innerIndex].source_field_meta = event.id
          this.condition.inner_condition[innerIndex].placeHolder = event.placeholder
          if(event.type == "DROPDOWN") {
            this.condition.inner_condition[innerIndex].isValueMultiselected = event.meta_data.datasource.is_multi_select
            this.condition.inner_condition[innerIndex].valueList = this.sortPipe.transform(event.meta_data.datasource.options.map(x => { return {
                id: x.value,
                name:x.label
              }
            }),'name')
          } else if(event.type == "PICKLIST") {
            this.condition.inner_condition[innerIndex].isValueMultiselected = event.pick_list.multiselect
            this.condition.inner_condition[innerIndex].valueList = this.sortPipe.transform(event.pick_list.picklist_item.map(x => { return {
                id: x.value,
                name:x.label
              }
            }),'name')
          }
        }
      }
    }
    if(moduleName == 'operator' && !this.condition.inner_condition[innerIndex].selectedOperator) {
      this.condition.inner_condition[innerIndex].selectedValue = null
    }
    this.allSelectedValues = this.condition.inner_condition.map(x => x.selectedValue).flat();
    this.condition.inner_condition.outerIndex = outerIndex;
    this.updatedInnerCondition.emit(this.condition.inner_condition)
  }

  // Call search API while typing value in select value dropdown
  searchValues(term, innerIndex, inner_group,modulename?) {
    const eventData = this.propertyList?.find(x => x?.id === inner_group?.selectedProperty);
    if(eventData) {
      if(eventData?.ruleField?.fieldMeta) {
        eventData.ruleField.fieldMeta = JSON.parse(JSON.stringify(eventData?.ruleField?.fieldMeta))
      }
      if(modulename == 'customfield' || (modulename == 'selectedvalue' && (!eventData?.ruleField?.fieldMeta?.rendering?.outer_key.includes('foundational_data_types')))){
        if(this.condition.inner_condition[innerIndex]?.searchableName) {
          this.condition.inner_condition[innerIndex].searchableName = null
        }
        if((eventData?.ruleField?.slug == "custom_field" && modulename == 'customfield') || (eventData?.ruleField?.slug != "custom_field")) {
          this.getValuesByProperty(eventData, innerIndex, term)
        }
      } else {
        if(this.condition.inner_condition[innerIndex]?.nestSearchableName) {
          this.condition.inner_condition[innerIndex].nestSearchableName = null
        }
        this.getFoundationalDataValuesByProperty(eventData, innerIndex, term)
      }
    }
  }

  preventCharacters(event) {
    var charCode = (event.which) ? event.which : event.keyCode;
    // Only Numbers 0-9 & .
    if ((charCode < 48 || charCode > 57) && charCode != 46) {
      event.preventDefault();
      return false;
    } else {
      return true;
    }
  }

  // Common function for calling API and get data of value list in dropdown
  getValuesByProperty(eventData,innerIndex, term?) {
    if(eventData) {
      if(eventData?.config) {
        eventData.config = JSON.parse(JSON.stringify(eventData?.config))
      }
      if(eventData?.ruleField?.fieldMeta) {
        eventData.ruleField.fieldMeta = JSON.parse(JSON.stringify(eventData?.ruleField?.fieldMeta))
      }
      this.condition.inner_condition[innerIndex].operatorList = eventData?.ruleField?.ruleFieldOperator ?? this.condition.inner_condition[innerIndex].operatorList;
      this.condition.inner_condition[innerIndex].fieldType = eventData?.ruleField?.fieldType?.fieldType;
      this.condition.inner_condition[innerIndex].isRequiered = eventData?.config?.required ? true : false;
      this.condition.inner_condition[innerIndex].nestValuePlaceholder = eventData?.ruleField?.nestValuePlaceholder ? eventData?.ruleField?.nestValuePlaceholder : 'Please select'
      if (eventData?.ruleField?.fieldType?.fieldType?.toLowerCase() === 'dropdown') {
        if(eventData?.config?.static_dropdown) {
          let idArray = eventData?.ruleField?.fieldMeta?.rendering?.display_key_map.value || eventData?.ruleField?.fieldMeta?.rendering?.display_key_map.id;
          let nameArray = eventData?.ruleField?.fieldMeta?.rendering?.display_key_map.display_text || eventData?.ruleField?.fieldMeta?.rendering?.display_key_map.name;
          let tempData= [];
          for(let i=0; i<eventData?.ruleField?.fieldMeta?.rendering?.outer_key.length; i++){
            tempData = tempData[eventData?.ruleField?.fieldMeta?.rendering?.outer_key[i]]
          }
          this.condition.inner_condition[innerIndex].valueList = this.getArrangedData(tempData,idArray,nameArray)
        } else {
          let url = eventData?.ruleField?.dataSource?.apiURL;
          url = url.replace('{program_id}', this.programDetails?.id);
          url = url.replace('{module_code}', this.selectedModuleCode);
          url = url.replace('{foundational_data_type_id}', this.condition.inner_condition[innerIndex].selectedProperty);

          // term = this.condition.inner_condition[innerIndex]?.target_field_obj?.length == 1 && this.condition.inner_condition[innerIndex]?.searchableName ? this.condition.inner_condition[innerIndex].searchableName : term


          if (term || term == '') {
            this.valueListLoading = true;
            if((term || term == '') && url.includes('?')) {
              eventData?.ruleField?.fieldMeta?.rendering?.filter_param ? url += `&${eventData?.ruleField?.fieldMeta?.rendering?.filter_param}=${term}` : url += `&k=${term}`;
            } else if((term || term == '') && !url.includes('?')) {
              eventData?.ruleField?.fieldMeta?.rendering?.filter_param ? url += `?${eventData?.ruleField?.fieldMeta?.rendering?.filter_param}=${term}` : url += `?k=${term}`;
            }
          }
          this.progServ.get(url).subscribe((data: any) => {
            this.valueListLoading = false;
            this.condition.inner_condition[innerIndex].custom_fields_options = []
            let keyName = eventData?.ruleField?.fieldMeta?.rendering?.outer_key;
            let idArray = eventData?.ruleField?.fieldMeta?.rendering?.display_key_map.value || eventData?.ruleField?.fieldMeta?.rendering?.display_key_map.id;
            let nameArray = eventData?.ruleField?.fieldMeta?.rendering?.display_key_map.display_text || eventData?.ruleField?.fieldMeta?.rendering?.display_key_map.name;
            for(let i=0; i<eventData?.ruleField?.fieldMeta?.rendering?.outer_key.length; i++){
              data = data[eventData?.ruleField?.fieldMeta?.rendering?.outer_key[i]]
            }
            keyName?.includes('custom_fields') || keyName?.includes('foundational_data_types') ? this.condition.inner_condition[innerIndex].custom_fields_options = this.sortPipe.transform(data, 'name') : this.condition.inner_condition[innerIndex].valueList = this.getArrangedData(data,idArray || [],nameArray || [])

            if(this.condition.inner_condition[innerIndex]?.valueList?.length >= 1 && this.condition.inner_condition[innerIndex]?.target_field_obj?.length >= 1) {
              this.condition.inner_condition[innerIndex].valueList = [...this.condition.inner_condition[innerIndex]?.target_field_obj, ...this.condition.inner_condition[innerIndex].valueList]
              this.condition.inner_condition[innerIndex].valueList = [...new Set(this.condition.inner_condition[innerIndex].valueList)]
              let uniqueDataValues = [];
              this.condition.inner_condition[innerIndex].valueList.forEach(function(item){
                let i = uniqueDataValues.findIndex(x => x.id == item.id);
                if(i <= -1){
                  uniqueDataValues.push({id: item.id, name: item.name});
                }
              });
              this.condition.inner_condition[innerIndex].valueList = this.sortPipe.transform(uniqueDataValues, 'name')
              this.condition.inner_condition[innerIndex].nativeValueList
            }
            this.condition.inner_condition[innerIndex].nest_value = keyName?.includes('custom_fields') || keyName?.includes('foundational_data_types') ? true : false
            if(keyName?.includes('foundational_data_types') && (this.condition.inner_condition[innerIndex].selectedCustomField || this.condition.inner_condition[innerIndex].source_field_meta)) {
              this.getFoundationalDataValuesByProperty(eventData, innerIndex)
            }

            if(!keyName?.includes('foundational_data_types') && this.isEditMode && this.condition.inner_condition[innerIndex].selectedCustomField && !this.condition.inner_condition[innerIndex].valueList) {
              let customfield = data.filter(cust => cust.id == this.condition.inner_condition[innerIndex].selectedCustomField)[0]
              this.condition.inner_condition[innerIndex].fieldType = customfield?.type
              this.condition.inner_condition[innerIndex].source_field_meta = customfield.id
              this.condition.inner_condition[innerIndex].placeHolder = customfield.placeholder
              if(customfield.type == "DROPDOWN") {
                this.condition.inner_condition[innerIndex].isValueMultiselected = customfield.meta_data.datasource.is_multi_select
                this.condition.inner_condition[innerIndex].valueList = this.sortPipe.transform(customfield.meta_data.datasource.options.map(x => { return {
                    id: x.value,
                    name:x.label
                  }
                }),'name')
              } else if(customfield.type == "PICKLIST") {
                this.condition.inner_condition[innerIndex].isValueMultiselected = customfield.pick_list.multiselect
                this.condition.inner_condition[innerIndex].valueList = this.sortPipe.transform(customfield.pick_list.picklist_item.map(x => { return {
                    id: x.value,
                    name:x.label
                  }
                }),'name')
              }
              this.condition.inner_condition[innerIndex].selectedValue = this.condition?.inner_condition[innerIndex]?.isValueMultiselected ? this.condition?.inner_condition[innerIndex]?.target_field_value : this.condition?.inner_condition[innerIndex]?.target_field_value[0]
            }
          });
          //url includes foundation and source ruleField value then call new
        }
      }
      if(eventData?.ruleField?.ruleFieldOperator?.length) {
        this.condition.inner_condition[innerIndex].operatorList = eventData?.ruleField?.ruleFieldOperator
      }
      if(eventData?.config && !this.condition.inner_condition[innerIndex].selectedCustomField) {
        eventData.config = JSON.parse(JSON.stringify(eventData?.config))
        this.condition.inner_condition[innerIndex].isValueMultiselected = eventData?.config?.multiselect ? true : false
      }
    }
  }

  getArrangedData(data,idarray,namearray){
    let mappeddata = []
    for(let i=0; i<idarray.length; i++){
      if(i==0){
        mappeddata = data.map(x => {
            x["finalid"] = x[idarray[i]];
            return x
        })
      } else {
        mappeddata = data.map(x => {
          x["finalid"] = x["finalid"][idarray[i]];
          return x
        })
      }
    }
    for(let i=0; i<namearray.length; i++){
      if(i==0){
        mappeddata = data.map(x => {
          x["finalname"] = x[namearray[i]];
          return x
        })
      } else {
        mappeddata = data.map(x => {
          x["finalname"] = x["finalname"][namearray[i]];
          return x
        })
      }
    }
    const result = mappeddata.map((x) => ({id: x.finalid, name: x.finalname}))
    return this.sortPipe.transform(result, 'name')
  }

  // Get Values of foundational data type
  getFoundationalDataValuesByProperty(eventData,innerIndex, term?) {
    if(eventData && eventData.children) {
      this.condition.inner_condition[innerIndex].operatorList = eventData?.children[0]?.ruleField?.ruleFieldOperator ?? this.condition.inner_condition[innerIndex].operatorList;
      this.condition.inner_condition[innerIndex].fieldType = eventData?.children[0]?.ruleField?.fieldType?.fieldType;
      this.condition.inner_condition[innerIndex].isRequiered = eventData?.children[0]?.config?.required ? true : false;
      if (eventData?.children[0]?.ruleField?.fieldType?.fieldType?.toLowerCase() === 'dropdown') {
        let url = eventData?.children[0]?.ruleField?.dataSource?.apiURL;
        if(url) {
          this.condition.inner_condition[innerIndex].nest_value = true
          this.condition.inner_condition[innerIndex].append_path_from_child = true
          url = url.replace('{program_id}', this.programDetails?.id);
          url = url.replace('{parent-uuid}', this.condition.inner_condition[innerIndex].selectedCustomField ? this.condition.inner_condition[innerIndex].selectedCustomField : this.condition.inner_condition[innerIndex].source_field_meta);
          term = this.condition.inner_condition[innerIndex]?.nestSearchableName ? this.condition.inner_condition[innerIndex].nestSearchableName : term
          if(eventData.ruleField.fieldMeta) {
            eventData.ruleField.fieldMeta = JSON.parse(JSON.stringify(eventData?.ruleField?.fieldMeta))
          }
          if (term || term == '') {
            if((term || term == '') && url.includes('?')) {
              eventData?.ruleField?.fieldMeta?.rendering?.filter_param ? url += `&${eventData?.ruleField?.fieldMeta?.rendering?.filter_param}=${term}` : url += `&k=${term}`;
            } else if((term || term == '') && !url.includes('?')) {
              eventData?.ruleField?.fieldMeta?.rendering?.filter_param ? url += `?${eventData?.ruleField?.fieldMeta?.rendering?.filter_param}=${term}` : url += `?k=${term}`;
            }
          }
          this.valueListLoading = true;
          this.progServ.get(url).subscribe((data: any) => {
            this.valueListLoading = false;
            this.condition.inner_condition[innerIndex].valueList = this.sortPipe.transform(data.foundational_data, 'name')
            this.condition.inner_condition[innerIndex].target_field_obj = data.foundational_data.filter(x => x.id == this.condition.inner_condition[innerIndex].target_field_obj[0].id)
            url = url.replace('{program_id}', this.programDetails?.id);
            if(this.condition.inner_condition[innerIndex]?.valueList?.length >= 1 && this.condition.inner_condition[innerIndex]?.target_field_obj?.length >= 1) {
              // call diffrent API for default list data and merge serched result in dropdown.
              if(this.condition.inner_condition[innerIndex]?.nestSearchableName) {
                this.valueListLoading = true;
                url = eventData?.children[0]?.ruleField?.dataSource?.apiURL;
                url = url.replace('{program_id}', this.programDetails?.id);
                url = url.replace('{foundational_data_type_id}', this.condition.inner_condition[innerIndex].selectedCustomField ? this.condition.inner_condition[innerIndex].selectedCustomField : this.condition.inner_condition[innerIndex].source_field_meta);
                url = url.replace('{parent-uuid}', this.condition.inner_condition[innerIndex].selectedCustomField ? this.condition.inner_condition[innerIndex].selectedCustomField : this.condition.inner_condition[innerIndex].source_field_meta);
                this.progServ.get(url).subscribe((default_data: any) => {
                  this.valueListLoading = false;
                  this.condition.inner_condition[innerIndex].valueList = this.sortPipe.transform(default_data.foundational_data, 'name')
                });
              }
              this.condition.inner_condition[innerIndex].valueList = [...this.condition.inner_condition[innerIndex]?.target_field_obj, ...this.condition.inner_condition[innerIndex].valueList]
              this.condition.inner_condition[innerIndex].valueList = [...new Set(this.condition.inner_condition[innerIndex].valueList)]
              let uniqueDataValues = [];
              this.condition.inner_condition[innerIndex].valueList.forEach(function(item){
                let i = uniqueDataValues.findIndex(x => x.id == item.id);
                if(i <= -1){
                  uniqueDataValues.push({id: item.id, name: item.name, code: item.code});
                }
              });
              this.condition.inner_condition[innerIndex].valueList = this.sortPipe.transform(uniqueDataValues, 'name')
              this.condition.inner_condition[innerIndex].selectedValue = this.condition.inner_condition[innerIndex].isValueMultiselected ? this.condition.inner_condition[innerIndex].target_field_value : this.condition.inner_condition[innerIndex].target_field_value[0]
            }
            if(this.isEditMode && this.condition.inner_condition[innerIndex].selectedCustomField && !this.condition.inner_condition[innerIndex].valueList) {
              this.condition.inner_condition[innerIndex].fieldType = this.condition.inner_condition[innerIndex].custom_fields_options.filter(x => x.id == this.condition.inner_condition[innerIndex].selectedCustomField)[0]?.type
            }
          });
        }
      }
      if(eventData?.children[0]?.ruleField?.ruleFieldOperator?.length) {
        this.condition.inner_condition[innerIndex].operatorList = eventData?.children[0]?.ruleField?.ruleFieldOperator
      }
      if(eventData?.children[0]?.config) {
        this.condition.inner_condition[innerIndex].isValueMultiselected = eventData?.children[0]?.config?.multiselect ? true : false
      }
    }
  }

  // Remove outer group of condition
  outerRemoveGroup(outerIndex) {
    this.fullcondition.splice(outerIndex+1,1)
    this.removeOuterGroup.emit(this.fullcondition)
  }

  // To remove first inner condition group
  outerRemoveinnerFirstGroup(outerIndex,inner_group) {
    inner_group.inner_condition.splice(outerIndex,1)
  }

  // To remove Define Condition group
  emitToOuterRemoveGroup() {
    this.removeOuterGroup.emit(this.fullcondition)
  }

}
