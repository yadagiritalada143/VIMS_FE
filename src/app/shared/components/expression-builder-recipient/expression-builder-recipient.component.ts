import {Component, OnInit, Input,Output,EventEmitter} from '@angular/core';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { ProgramSetupService } from 'src/app/program-setup/program-setup.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';

@Component({
  selector: 'app-expression-builder-recipient',
  templateUrl: './expression-builder-recipient.component.html',
  styleUrls: ['./expression-builder-recipient.component.scss']
})
export class ExpressionBuilderRecipientComponent implements OnInit {

  @Input() recipientsData;
  @Input() isEditMode;
  @Input() level
  @Input() selectedModuleCode
  @Input() selectedEvent
  @Input() allSelectedRecipientsData;
  @Output() updatedRecipientsData = new EventEmitter();

  programDetails: any = {};
  userDetails: any = {};
  recipientsFields : any = {
    meta_data :{}
  };
  selectedRecipent : any = {};
  valueListLoading : boolean = false;

  conditionalSubItem: boolean = true;

  constructor(private alert: AlertService, private progServ: ProgramSetupService, private storeServ: StorageService,private sortPipe: SortHelperPipe) {
    this.programDetails = this.storeServ.get(StorageKeys.CURRENT_PROGRAM);
    this.userDetails = JSON.parse(localStorage.getItem('user'));
  }

  ngOnInit(): void {
    if(this.isEditMode) {
      this.recipientsFields.recipient_type_id = this.level.recipients.recipient_type
      this.changeRecipientTypeData(this.level.recipients.recipient_type)
    }
  }

  // Get event on change of recipent type field based on that calling "loadFields" Function
  changeRecipientTypeData(selectedRecipientData) {
    if(selectedRecipientData) {
      selectedRecipientData = this.recipientsData.filter(x => x.id == selectedRecipientData)[0]
      for(let i=0; i < this.recipientsFields.meta_data.length; i++) {
        this.recipientsFields.meta_data[i].selectedvalue = null
      }
      this.selectedRecipent = selectedRecipientData
      if(selectedRecipientData?.metadata?.render_parameter_schema === false) {
        this.recipientsFields.meta_data = []
        if(selectedRecipientData.metadata.show_any_all_selection) {
          let metaData = {}
          metaData['show_any_all_selection'] = selectedRecipientData.metadata.show_any_all_selection
          metaData['label'] = "Approval Completion Rule"
          metaData['type'] = "DROPDOWN"
          metaData['multiselct'] = false;
          metaData['required'] = true;
          metaData['itemValues'] = [{id:'ANY', name: 'Any Approver'}, {id: 'ALL', name: 'All Approvers'}]
          metaData['selectedvalue'] = this.level.recipients.recipient_type == this.selectedRecipent.id ?  this.level.recipients.behaviour : null
          this.recipientsFields.meta_data.push(metaData);
        }
        this.changeData()
        return true
      } else {
        this.loadFields(selectedRecipientData)
      }
    } else {
      this.selectedRecipent = []
      this.recipientsFields.meta_data = []
      this.changeData()
    }
  }

  // Get an idea when dynamic field value gets changed
  changeData(index?, field?,event?) {
    if(!field?.selectedvalue) {
      this.searchValues("",index,field)
    }
    let meta_data = {}
    let behaviour = null
    let validateBehaviour = false
    for(let i=0; i < this.recipientsFields.meta_data.length; i++) {
      if(this.recipientsFields.meta_data[i].show_any_all_selection) {
        if(!this.recipientsFields.meta_data[i]?.selectedvalue) {
          validateBehaviour = true
        }
        behaviour = this.recipientsFields.meta_data[i]?.selectedvalue
      } else {
        if(!this.recipientsFields.meta_data[i]?.required) {
          this.recipientsFields.meta_data[i].selectedvalue = !this.recipientsFields.meta_data[i].selectedvalue && this.recipientsFields.meta_data[i].selectedvalue !=0 ? '' : this.recipientsFields.meta_data[i].selectedvalue
        }
        meta_data[this.recipientsFields.meta_data[i].selectedkey] = this.recipientsFields.meta_data[i]?.selectedvalue
      }
    }
    let recipientPayload = {}
    if(behaviour != null || behaviour) {
      recipientPayload = {
        'recipient_type_id': this.selectedRecipent.id,
        'meta_data': meta_data,
        'behaviour' : behaviour
      }
    } else if(behaviour == null || !behaviour) {
      recipientPayload = {
        'recipient_type_id': this.selectedRecipent.id,
        'meta_data': meta_data
      }
    }
    if(validateBehaviour) {
      recipientPayload['emptyBehaviour'] = true
    }
    if(this.selectedRecipent.canBeMultiple) {
      recipientPayload['canBeMultiple'] = this.selectedRecipent['canBeMultiple']
    }
    this.updatedRecipientsData.emit(recipientPayload)
  }

  clearMetadataValue() {
    this.level.recipients.behaviour = null;
    this.recipientsFields.meta_data.forEach(x => x.selectedvalue = null);
    this.changeData()
  }

  searchValues(term, index, field): any {
    if(field) {
      if(!field?.render_children_as_dropdown) {
        let getFieldData = this.selectedRecipent.parameter_schema.field_configs.filter(x => x.id == field.selectedkey)[0]
        if(getFieldData?.field.data_source?.api_url) {
          let url = getFieldData?.field.data_source?.api_url
          if(url) {
            if((term || term == '') && url.includes('?')) {
              getFieldData?.field.field_meta?.rendering?.filter_param ? url += `&${getFieldData?.field.field_meta?.rendering?.filter_param}=${term}` : url += `&k=${term}`;
            } else if((term || term == '') && !url.includes('?')) {
              getFieldData?.field.field_meta?.rendering?.filter_param ? url += `?${getFieldData?.field.field_meta?.rendering?.filter_param}=${term}` : url += `?k=${term}`;
            }
            this.getMemberData(url,index,this.selectedRecipent)
          }
        }
      }
    }
  }

  isObjectEmpty(object: any) {
    return object && Object.keys(object).length === 0 && object.constructor === Object;
  }

  getMemberData(url,index,selectedRecipientData?) {
    if(url) {
      url = url.replace('<module_code>',  this.selectedModuleCode)
      url = url.replace('<program_id>', this.programDetails.id)
      url = url.replace('<event_id>', this.selectedEvent)
      url = url.replace('<member_id>', this.userDetails._id)
      if(this.recipientsFields?.meta_data?.length) {
        this.recipientsFields.meta_data[index].valueListLoading = true;
        this.progServ.get(url).subscribe((membersData : any) => {
          if(membersData) {
            let keyName = selectedRecipientData?.parameter_schema?.field_configs[index]?.field.field_meta?.rendering?.outer_key;
            let idArray = selectedRecipientData?.parameter_schema?.field_configs[index]?.field.field_meta?.rendering?.display_key_map.value || selectedRecipientData?.parameter_schema?.field_configs[index]?.field.field_meta?.rendering?.display_key_map.id;
            let nameArray = selectedRecipientData?.parameter_schema?.field_configs[index]?.field.field_meta?.rendering?.display_key_map.display_text || selectedRecipientData?.parameter_schema?.field_configs[index]?.field.field_meta?.rendering?.display_key_map.name;
            this.recipientsFields.meta_data[index].itemValues = this.getArrangedData(membersData[keyName],idArray,nameArray)
            this.recipientsFields.meta_data[index].itemValues = [...new Set(this.recipientsFields?.meta_data[index]?.itemValues)]
            if(!this.isObjectEmpty(this.level?.recipients) && !this.isObjectEmpty(this.level?.recipients?.meta_data) && (this.level?.recipients.recipient_type == selectedRecipientData.id)){
              this.recipientsFields.meta_data[index].itemValues = [...this.level?.recipients?.meta_data[index]?.input_value ? this.level?.recipients?.meta_data[index]?.input_value : [], ...this.recipientsFields.meta_data[index]?.itemValues]
            }
            let uniqueDataValues = [];
            this.recipientsFields.meta_data[index].itemValues.forEach(function(item){
              let i = uniqueDataValues.findIndex(x => x.id == item.id);
              if(i <= -1){
                uniqueDataValues.push({id: item.id, name: item.name, code: item.code});
              }
            });
            this.recipientsFields.meta_data[index].itemValues = this.sortPipe.transform(uniqueDataValues, 'name')
            this.recipientsFields.meta_data[index].selectedValue = this.recipientsFields?.meta_data[index]?.input_value && this.recipientsFields?.meta_data[index]?.input_value?.length > 0 ? this.recipientsFields?.meta_data[index]?.input_value[0] : this.recipientsFields?.meta_data[index]?.input_value
            this.recipientsFields.meta_data[index].valueListLoading = false;
          }
        },err => {
          this.recipientsFields.meta_data[index].valueListLoading = false;
          this.alert.error(err.error?.error?.message ? err.error?.error?.message :  err.error, {})
        });
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

  preventNonNumericalInput(event) {
    var charCode = (event.which) ? event.which : event.keyCode;
    // Only Numbers 0-9 & .
    if ((charCode < 48 || charCode > 57) && charCode != 46) {
      event.preventDefault();
      return false;
    } else {
      return true;
    }
  }

  // Generate dynamic field based on recipient field type
  loadFields(selectedRecipientData) {
    this.recipientsFields.meta_data = []
    let metaData = {}
    for(let i=0; i < selectedRecipientData.parameter_schema.field_configs.length; i++) {
      metaData = {}
      metaData['label'] = selectedRecipientData.parameter_schema.field_configs[i].config.display_name ? selectedRecipientData.parameter_schema.field_configs[i].config.display_name : selectedRecipientData.parameter_schema.field_configs[i].field?.name;
      metaData['type'] = selectedRecipientData.parameter_schema.field_configs[i].field.field_type
      metaData['multiselct'] = selectedRecipientData.parameter_schema.field_configs[i].config.multiselct;
      metaData['required'] = selectedRecipientData.parameter_schema.field_configs[i].config.required;
      metaData['selectedkey'] =  selectedRecipientData.parameter_schema.field_configs[i].id
      metaData['selectedslug'] =  selectedRecipientData.slug
      metaData['placement_order'] =  selectedRecipientData.parameter_schema.field_configs[i].placement_order
      if(Array.isArray(this.level?.recipients?.meta_data) && this.isEditMode) {
        this.level?.recipients?.meta_data?.forEach((x:any) => {
          if(x.selectedkey == metaData['selectedkey']) {
            if(x?.render_children_as_dropdown) {
              metaData['selectedvalue'] = selectedRecipientData.parameter_schema.field_configs[i]?.children?.filter( y => x.selectedvalue == y?.field?.id)[0]?.id
            } else {
              metaData['selectedvalue'] = x?.selectedvalue
            }
          }
        })
      }
      if(selectedRecipientData.parameter_schema.field_configs[i].field.field_type == "DROPDOWN") {
        if(selectedRecipientData.parameter_schema.field_configs[i].config?.render_children_as_dropdown && selectedRecipientData.parameter_schema.field_configs[i]?.children?.length) {
          metaData['render_children_as_dropdown'] = true
          metaData['itemValues'] = this.sortPipe.transform(selectedRecipientData.parameter_schema.field_configs[i]?.children?.map(x => { return {
              id: x.id,
              name: x?.field?.config?.display_name || x?.field?.name
            }
          }),'name')
          this.recipientsFields.meta_data.push(metaData);
        } else {
          if(selectedRecipientData.parameter_schema.field_configs[i].field.data_source) {
            metaData['render_children_as_dropdown'] = false
            this.recipientsFields.meta_data.push(metaData);
            let url = selectedRecipientData.parameter_schema.field_configs[i].field.data_source.api_url
            if(url) {
              this.getMemberData(url,i,selectedRecipientData)
            }
          }
        }
      } else {
        this.recipientsFields.meta_data.push(metaData);
      }
    }
    if(selectedRecipientData.metadata.show_any_all_selection) {
      metaData = {}
      metaData['show_any_all_selection'] = selectedRecipientData.metadata.show_any_all_selection
      metaData['label'] = "Approval Completion Rule"
      metaData['type'] = "DROPDOWN"
      metaData['multiselct'] = false;
      metaData['required'] = true;
      metaData['itemValues'] = [{id:'ANY', name: 'Any Approver'}, {id: 'ALL', name: 'All Approvers'}]
      metaData['selectedvalue'] = this.level.recipients.recipient_type == this.selectedRecipent.id ?  this.level.recipients.behaviour : null
      this.recipientsFields.meta_data.push(metaData);
    }
    this.recipientsFields.meta_data.sort(function(a, b){ return a.placement_order - b.placement_order });
    this.changeData()
  }
}
