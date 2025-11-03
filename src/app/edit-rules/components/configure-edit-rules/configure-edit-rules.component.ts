import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { ProgramService } from 'src/app/programs/program.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime} from 'rxjs/operators';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';

@Component({
  selector: 'app-configure-edit-rules',
  templateUrl: './configure-edit-rules.component.html',
  styleUrls: ['./configure-edit-rules.component.scss']
})
export class ConfigureEditRulesComponent implements OnInit {

  public toggleAllowEdit = {
    title: 'Active',
    value: true
  }

  public ruleList = [];
  public roleList: any = [];
  public moduleList: any = [];
  public statusList: any = [];
  public fieldList: any = [];
  public tempFieldList: any = [];
  public selectedFieldList: any = [];
  public previousFieldSelection: any = {};
  public objectStatusAccordingToModule = {};
  public roleLoading: any = false;
  public visibleAccordion: any = null;
  public validationCheck: boolean = false;
  public showSave: boolean = false;
  public selectedModules: any = [];
  public selectedRoles: any = [];
  public selectedStatuses: any = [];
  public programId: any = null;
  public isEdit: boolean = window.location.href.includes('edit-rules/edit-edit-rules');
  public isView: boolean = window.location.href.includes('edit-rules/view-edit-rules');
  public ruleId: string;
  public thisEditData: any;

  public subscriptions: Subscription[] = [];
  public roleSubject: Subject <string> = new Subject <string> ();
  constructor(
    private router: Router,
    private localStorage: StorageService,
    private programService: ProgramService,
    private loader: LoaderService,
    private route: ActivatedRoute,
    private alert: AlertService
  ) { }

  ngOnInit(): void {
    let currentProgram = this.localStorage.get("CurrentProgram");
    this.programId = currentProgram?.id;
    this.getRoleList();
    this.getModuleList()
    .then(()=>{
      if(this.isEdit || this.isView){
        this.ruleId = this.route.snapshot.paramMap.get('id');
        this.onEdit();
      }
    });
    this.roleSubject
    .pipe (
      debounceTime(1200)
    ).subscribe(term => {
      if(term) {
        this.roleList = [];
        this.getRoleList(term);
      }
    });
  }

  goToSettings() {
    this.router.navigate(['/edit-rules/configure-edit-rules']);
  }

  async getRoleList(term:any = null) {
    let url = `/configurator/programs/${this.programId}/roles?status=true&org_category=MSP,CLIENT`;
    if(term) {
      url += `&k=${term}`;
    }
    this.loader.show();
    this.roleLoading = true;
    await this.programService.get(url)
    .toPromise()
    .then((data: any) => {
      this.loader.hide();
      this.roleLoading = false;
      this.roleList = data?.roles;
    }, (err) => {
      this.roleLoading = false;
      this.loader.hide();
    })
  }

  async getModuleList() {
    this.loader.show();
    await this.programService.get(`/configurator/programs/${this.programId}/edit-rules/edit-rule-module-config?limit=50`)
        .toPromise()
        .then((data) => {
            this.moduleList = data?.['edit-rule-modules'];
            this.moduleList?.forEach((module: any)=>{
              this.objectStatusAccordingToModule[module?.id] = module?.status_list;
            });
            this.loader.hide();
        })
        .catch((err) => {
          this.loader.hide();
        })

  }

  async onEdit() {
    this.loader.show();
    this.programService.get(`/configurator/programs/${this.programId}/edit-rules/edit-rule-sets/${this.ruleId}`)
    .toPromise()
    .then((data: any) => {
      this.toggleAllowEdit.value = data?.is_enabled;
      this.selectedModules = data?.modules.map((moduleSet: any) => {return moduleSet?.id})
      this.selectedRoles = data?.roles.map((roleSet: any) => {return roleSet?.id});
      data.roles.forEach((roleSet: any) => {
        let ind = this.roleList.findIndex((role: any) => role?.id == roleSet?.id);
        if(ind==-1){
          this.roleList.push(roleSet);
        }
      })
      this.onChangeModuleValue();
      this.selectedStatuses = [...data?.statuses];
      this.getEditRuleFieldList(this.selectedModules?.toString())
      .then(()=>{
        this.ruleList = data?.rules?.map((ruleItem: any) => {
          this.tempFieldList = this.tempFieldList.concat(ruleItem?.edit_rule_fields);
          this.fieldList = this.fieldList.concat(ruleItem?.edit_rule_fields);
          return {
            attachemnt_required: ruleItem?.attachemnt_required,
            notes_required: ruleItem?.notes_required,
            field_id: ruleItem?.edit_rule_fields?.map((field: any) => {return field?.id}),
            id: ruleItem?.id,
            keep: true
          }
        })
        this.ruleList.forEach((ruleItem: any,index: any) => {
          this.onChangeFieldNameValue(ruleItem?.field_id, index);
        })
        if(!this.isView)
          this.showSave = true;
      })
      this.thisEditData = data;
      this.loader.hide();
    })
    .catch((err) => {
      this.loader.hide();
      this.alert.error(err);
    })
  }

  async getEditRuleFieldList(module: any) {
    this.loader.show();
    let url=`/configurator/programs/${this.programId}/edit-rules/available-edit-rules?exclude_used_for_modules=${module}`;
    await this.programService.get(url)
        .toPromise()
        .then((data) => {
            this.fieldList = [...data?.['available-edit-rules']?.rule_fields];
            this.tempFieldList = [...data?.['available-edit-rules']?.rule_fields];
            this.loader.hide();
        })
        .catch((err) => {
          this.loader.hide();
        })

  }

  onClickToggle() {
    this.toggleAllowEdit.value = !this.toggleAllowEdit.value;
    if(this.toggleAllowEdit.value){
      this.toggleAllowEdit.title = 'Active';
    }
    else {
      this.toggleAllowEdit.title = 'InActive';
    }
  }

  onChangeModuleValue(){
    if(!this.selectedModules){
      this.validationCheck = true;
      this.showSave = false;
      this.selectedStatuses = [];
      this.statusList = [];
      this.fieldList = [];
      this.tempFieldList = [];
      this.selectedFieldList = [];
      this.ruleList = [];
      this.previousFieldSelection = {};
    }
    else if(this.selectedModules?.length == 0){
      this.validationCheck = true;
      this.showSave = false;
      this.selectedStatuses = [];
      this.statusList = [];
      this.fieldList = [];
      this.tempFieldList = [];
      this.selectedFieldList = [];
      this.ruleList = [];
      this.previousFieldSelection = {};
    } 
    else {
      this.statusList=[];
      this.selectedModules.forEach((module_id: any)=>{
        this.objectStatusAccordingToModule[module_id].forEach((status: any)=>{
          if(!this.statusList.includes(status)){
            this.statusList.push(status);
          }
        })
      });
      this.fieldList = [];
      this.tempFieldList = [];
      this.selectedFieldList = [];
      this.ruleList = [];
      this.previousFieldSelection = {};
      if(!this.isEdit)
        this.getEditRuleFieldList(this.selectedModules?.toString());
      else {
        if(this.thisEditData){
          this.getEditRuleFieldList(this.selectedModules?.toString()).then(() => {
            this.thisEditData?.rules?.forEach((ruleItem: any) => {
              this.tempFieldList = this.tempFieldList.concat(ruleItem?.edit_rule_fields);
              this.fieldList = this.fieldList.concat(ruleItem?.edit_rule_fields);
            })
          })
        }
      }
      if(!this.selectedRoles || this.selectedRoles?.length === 0 || !this.selectedStatuses || this.selectedStatuses?.length === 0){
        return;
      }
      this.validationCheck = false;
      if(this.ruleList?.length>0){
        this.showSave = true;
      }
    }
  }

  onChangeRoleValue(){
    if(!this.selectedRoles){
      this.validationCheck = true;
      this.showSave = false;
    }
    else if(this.selectedRoles?.length == 0){
      this.validationCheck = true;
      this.showSave = false;
    } 
    else {
      if(!this.selectedModules || this.selectedModules?.length === 0 || !this.selectedStatuses || this.selectedStatuses?.length === 0){
        return;
      }
      this.validationCheck = false;
      if(this.ruleList?.length>0){
        this.showSave = true;
      }
    }
  }

  onChangeObjectStatusValue(){
    if(!this.selectedStatuses){
      this.validationCheck = true;
      this.showSave = false;
    }
    else if(this.selectedStatuses?.length == 0){
      this.validationCheck = true;
      this.showSave = false;
    } 
    else {
      if(!this.selectedRoles || !this.selectedModules || this.selectedModules?.length === 0 || this.selectedRoles?.length === 0){
        return;
      }
      this.validationCheck = false;
      if(this.ruleList?.length>0){
        this.showSave = true;
      }
    }
  }

  addRule() {
    if(this.selectedModules?.length == 0 || this.selectedRoles?.length == 0 || this.selectedStatuses?.length == 0){
      this.validationCheck = true;
      this.showSave = false;
      return;
    }
    if(this.fieldList?.length == 0){
      this.alert.error("Unable to Add More Rules As No Unique Field Name Available to Select");
      return ;
    }
    
    this.showSave = true;
    this.ruleList.push({field_id: [], attachemnt_required: true, notes_required: true, keep: true}); 
  }

  onChangeFieldNameValue(event:any,index: any){
    event.forEach((field: any) => {
      if(this.selectedFieldList.includes(field)){
        if(!this.previousFieldSelection?.[index]?.includes(field)){
          let ind = event?.indexOf(field);
          event.splice(ind,1);
        }
      }
    });
    if(index in this.previousFieldSelection){
      this.previousFieldSelection[index]?.forEach((field: any) => {
          let ind = this.selectedFieldList?.indexOf(field);
          if(ind>-1)
          this.selectedFieldList.splice(ind,1);
      });
    }
    event.forEach((field: any) => {
      if(!this.selectedFieldList.includes(field))
        this.selectedFieldList.push(field);
    })
    this.ruleList[index].field_id = event;
    this.previousFieldSelection[index] = event;
    this.selectedFieldList?.forEach((field: any) =>{
        let ind = this.fieldList?.findIndex((fieldSet: any) => fieldSet?.id == field);
        if(ind>-1)
          this.fieldList.splice(ind,1);
    });
    this.tempFieldList?.forEach((field: any) => {
      if(!this.selectedFieldList?.includes(field?.id)){
        let ind = this.fieldList?.findIndex((fieldSet: any) => fieldSet?.id == field?.id);
        if(ind==-1)
          this.fieldList.push(field);
      }
    });
  }

  onChangeAttachment(index: any) {
    this.ruleList[index].attachemnt_required = !this.ruleList[index].attachemnt_required;
  }

  onChangeNotes(index: any) {
    this.ruleList[index].notes_required = !this.ruleList[index].notes_required;
  } 

  onclickArrow(id){
    if(id === this.visibleAccordion){
      this.visibleAccordion = null;
      return;
    }
     this.visibleAccordion = id;
  }

  deleteRule(index: any) {
    let newObj = {};
    delete this.previousFieldSelection?.[index];
    for(const ind in this.previousFieldSelection){
      if(ind>index){
        newObj[parseInt(ind)-1] = this.previousFieldSelection[ind];
      }
      else{
        newObj[ind] = this.previousFieldSelection[ind];
      }
    }
    this.previousFieldSelection = newObj;
    this.ruleList?.[index]?.field_id?.forEach((field: any) => {
      let ind = this.selectedFieldList?.indexOf(field);
      if(ind>-1){
        this.selectedFieldList?.splice(ind,1);
      }
      let fieldSetind = this.tempFieldList?.findIndex((fieldSet: any) => fieldSet?.id == field);
        if(fieldSetind>-1)
          this.fieldList.push(this.tempFieldList[fieldSetind]);
    })
    this.ruleList.splice(index,1);
    if(this.ruleList.length == 0){
      this.showSave = false;
    }
  }

  onSubmit() {
    if(!this.isEdit){
      let modules = this.selectedModules.map((module: any) => {
        return {[module]:true}
      });
      let roles = this.selectedRoles.map((role: any) => {
        return {[role]:true}
      });
      let statuses = this.selectedStatuses.map((status: any) => {
        return {[status]: true}
      });
      let rulesArr = this.ruleList.filter((fieldSet: any)=> fieldSet.field_id.length !=0 );
      if(rulesArr.length != this.ruleList.length){
        this.alert.warn("There is One Rule with empty field name either Select a fieldname for it or remove the rule");
        return;
      }
      let payload: any = {
        is_enabled: this.toggleAllowEdit?.value,
        modules,
        roles,
        statuses,
        rules: this.ruleList
      }
      this.loader.show();
      this.programService.post(`/configurator/programs/${this.programId}/edit-rules/edit-rule-sets`, payload)
      .toPromise()
      .then((res) => {
        this.alert.success("Edit Rule Configured Succesfully");
        this.loader.hide();
      })
      .then(()=>{
        this.router.navigate(['/edit-rules/configure-edit-rules']);
      })
      .catch((err) => {
        this.alert.error(errorHandler(err));
        this.loader.hide();
      })
    }
    else {
      let modules = [];
      this.thisEditData.modules.forEach((module: any) => {
        if(!this.selectedModules.includes(module?.id)){
          modules.push({[module?.id]:false});
        }
      });
      let newModules = this.selectedModules.map((module: any) => {
        return {[module]:true}
      });
      let roles = [];
      this.thisEditData.roles.forEach((role: any) => {
        if(!this.selectedRoles.includes(role?.id)){
          roles.push({[role?.id]:false});
        }
      });
      let newRoles = this.selectedRoles.map((role: any) => {
        return {[role]:true}
      });
      let statuses = [];
      this.thisEditData.statuses.forEach((status: any) => {
        if(!this.selectedStatuses.includes(status)){
          statuses.push({[status]:false});
        }
      });
      let newStatuses = this.selectedStatuses.map((status: any) => {
        return {[status]: true}
      });
      this.thisEditData.rules.forEach((ruleItem: any)=>{
        let ind = this.ruleList.findIndex((rule: any) => rule?.id == ruleItem?.id)
        if(ind==-1){
          this.ruleList.push({
            keep: false,
            id: ruleItem?.id,
            attachemnt_required: ruleItem?.attachemnt_required,
            notes_required: ruleItem?.notes_required,
            field_id: ruleItem?.edit_rule_fields?.map((field: any) => {return field?.id})
          })
        }
      })
      let rulesArr = this.ruleList.filter((fieldSet: any)=> fieldSet.field_id.length != 0 );
      if(rulesArr.length != this.ruleList.length){
        this.alert.warn("There is One Rule with empty field name either Select a fieldname for it or remove the rule");
        return;
      }
      let payload = {
        is_enabled: this.toggleAllowEdit.value,
        modules: modules.concat(newModules),
        roles: roles.concat(newRoles),
        statuses: statuses.concat(newStatuses),
        rules: this.ruleList
      }
      this.loader.show();
      this.programService.put(`/configurator/programs/${this.programId}/edit-rules/edit-rule-sets/${this.ruleId}`, payload)
      .toPromise()
      .then((res) => {
        this.alert.success("Edit Rule Configured Succesfully");
        this.loader.hide();
      })
      .then(()=>{
        this.router.navigate(['/edit-rules/configure-edit-rules']);
      })
      .catch((err) => {
        this.alert.error(errorHandler(err));
        this.loader.hide();
      })
    }
    
  }

  getFieldNameById(fieldId: any) {
    let fieldSet = this.tempFieldList.find((field: any) => field?.id == fieldId);
    return fieldSet?.name;
  }

  getSpliced(index: any, eventArray: any){
    let newEventArray = eventArray.filter((fieldid: any,ind: any) => ind!=index)
    return newEventArray;
  }

  searchRoles(evt: any) {
    const {term} = evt;
    this.roleSubject.next(term);
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }


}
