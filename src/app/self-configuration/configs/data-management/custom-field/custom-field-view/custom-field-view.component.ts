import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation, Renderer2, TemplateRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { ProgramService } from 'src/app/programs/program.service';
import { DatePipe } from '@angular/common';
import { CommonViewRuleFlowService } from 'src/app/shared/components/common-view-rule-flow/common-view-rule-flow.service';
import { CommonViewConfig } from 'src/app/shared/components/common-view-rule-flow/common-view-rule-flow.component';

@Component({
  selector: 'app-custom-field-view',
  templateUrl: './custom-field-view.component.html',
  styleUrls: ['./custom-field-view.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CustomFieldViewComponent implements OnInit {
  programId: any;
  customFieldId: any;
  entityCode: any;
  details : any = [];
  supportingDetails : any = [];
  linkedModuleList : any = [];
  moduleList : any = [];
  permissions_details: any = [];
  field_settings_details: any = [];
  public dateFormat;
  programDetails: any = {};
  created_at : any;
  customField : any;
  customFieldListByModule: any = [];
  public fieldTypeList = [];
  public associationDetails: Array <any> = [];
  customFieldIcon: any;
  selectedModuleCode: any;
  showDropdown : boolean = false;
  hideHierarchyInModules = ["WORK_LOCATIONS", "PROGRAM_USERS", "CANDIDATES", "MASTER_DATA_TYPE", "VENDORS","PROGRAM_DETAILS", "HIERARCHY"]
  hideLinkedPartInModules = ["WORK_LOCATIONS", "HIERARCHY", "MASTER_DATA_TYPE", "VENDORS"]
  hideDependentInModules = ["MASTER_DATA_TYPE", "PROGRAM_USERS", "WORK_LOCATIONS", "PROGRAM_DETAILS"]
  public hidePlaceholder = ["DROPDOWN", "RADIO", "CHECKBOX"]
  @ViewChild('actionTrigger', { read: ElementRef, static: false })
  actionTrigger: ElementRef | undefined;
  @ViewChild('actionDropdown', { read: ElementRef, static: false })
  actionDropdown: ElementRef | undefined;

  @ViewChild('status', { static: true }) statusTemplate: TemplateRef <any>;

  constructor (
    private renderer: Renderer2,
    private router: SvmsRouterService,
    private route: ActivatedRoute,
    private alert: AlertService,
    private programService: ProgramService,
    private loader: LoaderService,
    private localStorage: StorageService,
    public commonViewService: CommonViewRuleFlowService,
    public datePipe: DatePipe = new DatePipe('en-US')
  ) { this.programDetails = this.localStorage.get(StorageKeys.CURRENT_PROGRAM);
    this.renderer.listen('window', 'click', (e: Event) => {
      if (
        (this.actionTrigger && this.actionTrigger.nativeElement.contains(e.target) && !this.showDropdown) ||
        (this.actionDropdown && this.actionDropdown.nativeElement.contains(e.target))
      ) {
        const triggerPos = this.actionTrigger?.nativeElement.getBoundingClientRect();
        this.showDropdown = true;

        setTimeout(() => {
          const dropDownBox = document.getElementById('c-action-dropdown');
          dropDownBox?.setAttribute(
            'style',
            'top :  ' + (triggerPos.top + 50) + 'px; left: ' + (triggerPos.left - 155) + 'px; display : block',
          );
        }, 200);
      } else {
        this.showDropdown = false;
      }
    });}

  ngOnInit(): void {
    this.loadFieldTypes();
    this.dateFormat = this.programDetails?.defaultDateFormat;
    this.programId = this.localStorage.get(StorageKeys.PROGRAM_ID);
    this.customFieldId = this.route.snapshot.paramMap.get('id');
    this.entityCode = this.route.snapshot.queryParamMap.get('entity_ref')
    this.loadModules();
  }

  backtoList() {
    this.router.navigate(['data-management', 'custom-field', 'list'])
  }

  editCustomField() {
    this.router.navigate(['data-management', 'custom-field', 'edit', this.customFieldId], { queryParams: { entity_ref: this.entityCode }});
  }

  loadModules() {
    this.programId = this.localStorage.get(StorageKeys.PROGRAM_ID);
    this.programService.get(`/configurator/programs/${this.programId}/module-groups?module_customfield=true`).subscribe((data:any) => {
      if (data) {
        data.module_groups.forEach(x => {
          x.modules.forEach(innerModules => {
            this.moduleList.push(innerModules)
          })
        })
        this.getCustomFieldDetails();
      }
    })
  }

  getIfVendorExist(obj) {
    return obj.filter
  }
  public getSvgName(fileName: string) {
    return fileName?.split('.svg')?.length && fileName?.split('.svg')[0].length ? fileName?.split('.svg')[0] : '1';
  }
  loadFieldTypes() {
    this.programService.get('/configurator/resources/custom-fields').subscribe((data:any) => {
      if (data) {
        this.fieldTypeList = data.custom_fields
      }
    })
  }
  getIsLinked(linkedModuleList: any) {
    if(linkedModuleList.length > 0) {
      return linkedModuleList?.filter(x => x.linked)?.length > 0 ? true : false
    } else {
      return false
    }
  }
  private generateCustomFieldPayload = (formValue: any) => {
    const { type, name, label, placeholder, description, meta_data, is_required, is_enabled, entity_refs } = formValue;
    const entityRefs = entity_refs.map(ref => ({
      entity_ref: ref.entity_ref,
      can_edit: ref.can_edit.map(item => ({
        ...item,
        organizations: item.organizations.length > 0 ? item.organizations?.map(org => org.id) : null,
      })),
      can_view: ref.can_edit.map(item => ({
        ...item,
        organizations: item.organizations.length > 0 ? item.organizations?.map(org => org.id) : null,
      })),
    }));
    const payload = {
      type,
      name,
      label,
      placeholder,
      description,
      meta_data,
      is_required,
      is_enabled,
      entity_refs: entityRefs,
    };
    return payload;
  }
  deleteCustomField() {
    this.programService.get(`/configurator/programs/${this.programId}/custom-fields/${this.customFieldId}?entity_ref=${this.entityCode}`)
      .subscribe(
      (data:any) => {
        const customField = {
          ...data.custom_field
        };
        const payload = this.generateCustomFieldPayload(customField);
        payload.entity_refs.forEach(x => {
          return (x?.entity_ref || '')?.toUpperCase() === (this.selectedModuleCode || '')?.toUpperCase() ? x.add = false : x.add = true;
        });
        if(this.selectedModuleCode == 'PROGRAM_USERS') {
          payload['org_category'] = data.custom_field.org_category.map(x => x.organization_category)
        }
        if(payload.meta_data?.linked?.modules?.length > 0){ this.alert.error("Selected Custom field has been linked with other modules. Deletion can be possible only if linked module is removed.") }
        else {
          this.programService.put(`/configurator/programs/${this.programId}/custom-fields/${this.customFieldId}`, payload).subscribe(
          () => {
            this.alert.success(`Custom Field Deleted Succesfully`);
            this.backtoList();
          },
          res => {
            if (res?.error?.error?.message) {
              this.alert.error(res.error.error.message);
            }
          },
        );
        }
      },
      res => {
        if (res?.error?.error?.message) {
          this.alert.error(res.error.error.message);
        }
      },
    );
  }
  getCustomFieldDetails() {
    this.loader.show();
    this.programService.get(`/configurator/programs/${this.programId}/custom-fields/${this.customFieldId}?entity_ref=${this.entityCode}`)
      .subscribe({
        next: (customField: any) => {

          customField = customField?.custom_field;
          this.customField = customField;
          this.created_at = customField?.created_on
          this.customFieldIcon = this.fieldTypeList.filter(f => f.type == this.customField.type)[0]?.icon

          let linkedModuleData = []
          linkedModuleData = customField.meta_data?.linked ? customField.meta_data?.linked?.modules : []
          let modules = customField.entity_refs.filter(val => !linkedModuleData.includes(val.entity_ref));
          let selectedModuleCode = modules[0]?.entity_ref
          this.selectedModuleCode = selectedModuleCode
          this.linkedModuleList = this.moduleList?.filter(x => x.code == selectedModuleCode)[0]?.linked_modules || []
          this.linkedModuleList?.forEach(x => {
            if(customField?.meta_data?.linked?.modules?.includes(x.code)) {
              x.linked = true,
              x.can_view = customField.entity_refs.filter(er => er.entity_ref == x.code)[0]?.can_view
              x.can_view_vendors = x?.can_view?.filter(ven => ven.organization_category == 'VENDOR')?.length > 0 ? x?.can_view?.filter(ven => ven.organization_category == 'VENDOR')[0].organizations?.length > 0 ? x?.can_view?.filter(ven => ven.organization_category == 'VENDOR')[0].organizations : [{name : 'All', value: 'All'}] : []
              x.can_edit = customField.entity_refs.filter(er => er.entity_ref == x.code)[0]?.can_edit
              x.can_edit_vendors = x?.can_edit?.filter(ven => ven.organization_category == 'VENDOR')?.length > 0 ? x?.can_edit?.filter(ven => ven.organization_category == 'VENDOR')[0].organizations?.length > 0 ? x?.can_edit?.filter(ven => ven.organization_category == 'VENDOR')[0].organizations : [{name : 'All', value: 'All'}] : []
              x.is_readonly = customField.entity_refs.filter(er => er.entity_ref == x.code)[0]?.is_readonly
            }
          })
          customField?.meta_data?.datasource?.options.forEach(x => {
            x.dependentFields = customField?.meta_data?.depends_on?.conditions?.filter(dep => dep.condition.value == x.value)
          })
          this.details = [{
            label : "Module",
            value : selectedModuleCode,
            displayType : 'text'
          },
          {
            label : "Hierarchy",
            value : customField?.hierarchies?.map(x => {return {name : x.name, value : x.id}}),
            displayType : 'box-view'
          },
          {
            label : "Custom Field Name",
            value : customField?.name,
            displayType : 'text'
          },
          {
            label : "Status",
            value : customField?.is_enabled ? 'Active' : 'Inactive',
            displayType : 'status',
            enabled : true
          },
          {
            label : "Description",
            value : customField?.description,
            displayType : 'description'
          },
          {
            label : "Field Type",
            value : customField?.type,
            svgIcon: this.getSvgName(this.customFieldIcon),
            displayType : 'text'
          },
          {
            label : "Custom Field Label",
            value : customField?.label,
            displayType : 'text'
          },
          {
            label : "Placeholder",
            value : customField?.placeholder,
            displayType : 'text'
          }]
          this.supportingDetails = [
            {
              label : "Supporting Text",
              value : customField?.supporting_text,
              displayType : 'description'
            }
          ]
          if(selectedModuleCode == "PROGRAM_USERS") {
            this.details.splice(1, 0,{
              label : "Organization Category",
              value : customField?.org_category?.map(x => x?.organization_category).join(', '),
              displayType : 'text'
            })
          }

          if(selectedModuleCode == 'MASTER_DATA_TYPE') {
            this.details.splice(1, 0,{
              label : "Master Data Type",
              value : customField?.master_data_type?.[0]?.name || '--',
              displayType : 'text'
            })
          }

          if(this.hidePlaceholder.includes(customField?.type)) {
            this.details = this.details.filter(x => x.label != 'Placeholder')
          }

          if(selectedModuleCode && this.hideHierarchyInModules?.includes(selectedModuleCode)) {
            this.details = this.details.filter(x => x.label != 'Hierarchy')
          }

          if(customField?.meta_data?.default_value || customField?.meta_data?.default_value == 0) {
            if(Array.isArray(customField?.meta_data?.default_value)) {
              this.details.push({
                label : "Default File",
                value : customField?.meta_data?.default_value.map(x => x.name).join(', '),
                displayType : 'text'
              })
            } else {
              if(this.customField.type == "DATETIME"){
                this.details.push({
                  label : "Default Date & Time",
                  value : customField?.meta_data?.default_value,
                  displayType : 'text'
                })
              }else{
                this.details.push({
                  label : "Default Value",
                  value : customField?.meta_data?.default_value,
                  displayType : 'text'
                })
              }

            }
          }

          if(this.customField?.type === 'PICKLIST') {
            this.details.push({
              label: 'Picklist',
              value: customField?.pick_list?.name,
              displayType: 'text'
            })
          }

          if(customField?.type =='SOURCE') {
            this.details.push({
              label : "Source for List of Values",
              value : [{name : customField?.source_lov, value : customField?.source_lov}],
              displayType : 'box-view'
            },
            {
              label : "Select User Type",
              value : [{name : customField?.user_type, value : customField?.user_type}],
              displayType : 'box-view'
            },
            {
              label : "By Organization",
              value : [{name : customField?.user_category, value : customField?.user_category}],
              displayType : 'box-view'
            },
            {
              label : "Select User Role",
              value : [{name : customField?.user_role?.name, value : customField?.user_role?.name}],
              displayType : 'box-view'
            })

            if(customField?.user_type == 'BY ORGANIZATION') {
              this.details = this.details.filter(x => x.label != "Select User Role")
            }

            if(customField?.user_type == 'BY USER ROLE') {
              this.details = this.details.filter(x => x.label != "By Organization")
            }

            if(customField?.user_type == 'ALL') {
              this.details = this.details.filter(x => (x.label != "Select User Role" && x.label != "By Organization"))
            }
          }

          this.permissions_details = [
            {
              label : "Can View",
              value : customField?.entity_refs.filter(er => er.entity_ref == selectedModuleCode)[0]?.can_view?.map(x => {return {name : x.organization_category,value : x.organization_category}}),
              displayType : 'box-view'
            },
            {
              label : "Vendors Who Can View",
              value : customField?.entity_refs.filter(er => er.entity_ref == selectedModuleCode)[0]?.can_view?.filter(x => x.organization_category == 'VENDOR')[0]?.organizations?.length > 0 ? customField?.entity_refs.filter(er => er.entity_ref == selectedModuleCode)[0]?.can_view?.filter(x => x.organization_category == 'VENDOR')[0]?.organizations?.map(org => {return {name : org?.label, value : org?.id}}) : [{name : 'All', value : 'All'}],
              displayType : 'box-view'
            },
            {
              label : "Can Edit",
              value : customField?.entity_refs.filter(er => er.entity_ref == selectedModuleCode)[0]?.can_edit?.map(x => {return {name : x.organization_category, value : x.organization_category}}),
              displayType : 'box-view'
            },
            {
              label : "Vendors Who Can Edit",
              value : customField?.entity_refs.filter(er => er.entity_ref == selectedModuleCode)[0]?.can_edit?.filter(x => x.organization_category == 'VENDOR')[0]?.organizations?.length > 0 ? customField?.entity_refs.filter(er => er.entity_ref == selectedModuleCode)[0]?.can_edit?.filter(x => x.organization_category == 'VENDOR')[0]?.organizations?.map(org => {return {name : org?.label, value : org?.id}}) : [{name : 'All', value : 'All'}],
              displayType : 'box-view'
            }
          ]

          if(!customField?.entity_refs.filter(er => er.entity_ref == selectedModuleCode)[0]?.can_view?.map(x => {return {name : x.organization_category,value : x.organization_category}}).map(org => org.name).join(", ").includes("VENDOR")) {
            this.permissions_details = this.permissions_details.filter(x => x.label != "Vendors Who Can View")
          }
          if(!customField?.entity_refs.filter(er => er.entity_ref == selectedModuleCode)[0]?.can_edit?.map(x => {return {name : x.organization_category,value : x.organization_category}}).map(org => org.name).join(", ").includes("VENDOR")) {
            this.permissions_details = this.permissions_details.filter(x => x.label != "Vendors Who Can Edit")
          }

          this.field_settings_details= [
            {
              label : "Required",
              value : customField?.is_required,
              displayType : 'template-ref',
              template: this.statusTemplate
            },
            {
              label : "Read Only",
              value : customField?.is_readonly,
              displayType : 'template-ref',
              template: this.statusTemplate
            },
            {
              label : "Sensitive Data",
              value : customField?.data_subject_right,
              displayType : 'template-ref',
              template: this.statusTemplate
            },
            {
              label : "Linked",
              value : this.linkedModuleList?.filter(x => x.linked)?.length > 0,
              displayType : 'template-ref',
              template: this.statusTemplate
            },
          ]

          if(!this.showSensitiveData) {
            this.field_settings_details = this.field_settings_details.filter(x => x.label != "Sensitive Data")
          }

          if(customField.type == "NUMBERS") {
            let secondLastIndex = this.field_settings_details.length - 1;
            this.field_settings_details.splice(secondLastIndex, 0, {
              label : "Show in Thousands",
              value : customField?.meta_data?.show_in_thousands,
              displayType : 'template-ref',
              template: this.statusTemplate
            },
            {
              label : "Range Applicable",
              value : customField?.meta_data?.range_applicable,
              displayType : 'template-ref',
              template: this.statusTemplate
            },
            {
              label : "Range Min",
              value : customField?.meta_data?.range?.range_min || 0,
              displayType : 'text'
            },
            {
              label : "Range Max",
              value : customField?.meta_data?.range?.range_max || 0,
              displayType : 'text'
            });

            if(!customField?.meta_data?.range_applicable) {
              this.field_settings_details = this.field_settings_details.filter(x => (x.label != 'Range Min' && x.label != 'Range Max'))
            }

            if(customField?.meta_data?.decimal || customField?.meta_data?.decimal == 0) {
              this.details.push({
                label : "Decimal",
                value : customField?.meta_data?.decimal,
                displayType : 'text'
              })
            }
          }

          if(customField.type == 'HYPERLINK') {
            this.details.push({
              label : "URL",
              value : customField?.meta_data?.url,
              displayType : 'hyperlink'
            },)
            this.field_settings_details = this.field_settings_details.filter(x => (x.label != 'Read Only' && x.label != 'Sensitive Data'))
          }

          if(this.jobTypeAllowed && Array.isArray(customField?.job_type)) {

            let activeJobTypes: Array <string> = customField?.job_type
              .filter((entry: any) => {
                if('is_enabled' in entry) {
                  return entry?.is_enabled;
                }

                return true;
              })
              .map((entry: any) => ({name: entry?.label}));

            if(activeJobTypes.length) {
              this.associationDetails.push({
                label: "Job Type",
                displayType: CommonViewConfig.BOX_VIEW,
                value: activeJobTypes
              })
            } else {
              this.associationDetails.push({
                label: "Job Type",
                displayType: CommonViewConfig.TEXT,
                value: '--'
              })
            }
          }

          this.loader.hide();
        },
        error: (err: any) => {
          this.alert.error(err.error?.error?.message ? err.error?.error?.message :  err.error?.message, {})
          this.loader.hide();
        }
      })
  }

  get jobTypeAllowed() {
    return ![
      'VENDORS', 'HIERARCHY', 'MASTER_DATA_TYPE', 'PROGRAM_DETAILS', 'WORK_LOCATIONS', 'PROGRAM_USERS', 'CONFIGURATOR'
    ].includes(this.selectedModuleCode);
  }

  get showSensitiveData(): boolean {
    return !!(this.programDetails?.config?.data_subject_rights?.enabled);
  }
}
