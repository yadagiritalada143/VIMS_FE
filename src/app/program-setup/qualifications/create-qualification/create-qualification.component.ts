import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { EmitEvent, EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { ProgramService } from 'src/app/programs/program.service';
import { errorHandler } from '../../../shared/util/error-handler';

@Component({
  selector: 'app-create-qualification',
  templateUrl: './create-qualification.component.html',
  styleUrls: ['./create-qualification.component.scss']
})
export class CreateQualificationComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  @Input() isCreateQualificationItem = 'hidden';
  @Input() isViewClicked;
  @Output() onClose = new EventEmitter();
  selectedTreeArr = [];
  rendererData: any;
  tabIndex = 0;
  basicInfo = true;
  public status;
  label: string;
  public toggle = {
    title: 'Active',
    value: true
  };
  title: any;
  qualificationId: any;
  addNewQualificationForm: UntypedFormGroup;
  isViewMode: boolean = false;
  isUpdateReq: boolean = false;
  isCreate: boolean = true;
  toUPdateIteamId: any;
  qualificationSource = "new";
  checkedAll = false;
  bulkCreateList = [];
  SelectFromSystem: any = [];
  //details sent for confirmation box;
  needConfirmation: boolean = true;
  message: string;
  btnOkText: string = 'Leave this Page';
  btnCancelText: string = 'Stay on this Page';
  selectQualificationId = ''
  expandMore = false;
  clickOutside: boolean;

  constructor(private eventStream: EventStreamService,
    private fb: UntypedFormBuilder,
    private _programService: ProgramService,
    private storageService: StorageService,
    private _alertService: AlertService,
    private activatedRoute: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    let name;
    this.hierarchyList();
    this.subscriptions.push(this.activatedRoute.queryParams.subscribe((param:any) => {
      this.qualificationId = param['id'];
      name = `Add New ${param['name']}`;
    }));
    // Qualification form with required field
    this.addNewQualificationForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      code: ['', Validators.required],
      is_enabled: [true, Validators.required]


    })
   // hierarchy_units: this.selectedTreeArr
    //generate qunique Qualification code
    this.subscriptions.push(this.addNewQualificationForm.get('name').valueChanges.pipe(debounceTime(400),distinctUntilChanged()).subscribe(nameValue=>{
     if(this.qualificationSource === 'new' && !this.isViewMode){
      this.getUniqueCode(nameValue);
     }
    }));
    // create new qualification event
    this.subscriptions.push(this.eventStream.on(Events.CREATE_QUALIFICATION_ITEM).subscribe((data: any) => {
      if (data) {
        this.isCreateQualificationItem = 'visible';
        this.title = name;
        this.needConfirmation = true;
        this.isCreate = true;
        this.message = 'Are you sure you want to leave this page? Qualification is not created yet.';
        this.getDropdownData();
      } else {
        this.isCreateQualificationItem = 'hidden';
      }
      this.clickOutside = false;
    }));
    // For Edit Qualification item
    this.subscriptions.push(this.eventStream.on(Events.EDIT_QUALIFICATION_ITEM).subscribe((data:any) => {
      if (data.event) {
        this.title = `Edit (${data.data.name})`;
        this.toggle.value = data.data.is_enabled;
        this.toggle.title = data.data.is_enabled == true ? 'active' : 'inactive';
        this.isCreateQualificationItem = 'visible';
        this.addNewQualificationForm.patchValue(data.data, {emitEvent: false});
        this.message = 'Are you sure you want to leave this page? Qualification is not Updated yet.';
        this.getDropdownData();
        this.isUpdateReq = true;
        this.isCreate = false;
        this.isViewMode = false;
        this.needConfirmation = true;
        this.toUPdateIteamId = data.data.id;
        //this.selectedTreeArr = data.data.hierarchy_units;
      }
      this.clickOutside = false;
    }));
    // for view Qualification item
    this.subscriptions.push( this.eventStream.on(Events.QUALIFICATION_ITEM_VIEW).subscribe( (data: any) => {
      if (data.event) {
        this.toggle.title = data.data.is_enabled == true ? 'active' : 'inactive';
        this.toggle.value = data.data.is_enabled;
        this.title = `${data.data.name} detail view`;
        this.isViewMode = true;
        this.isUpdateReq = false;
        this.isCreate = false;
        this.needConfirmation = false;
        this.addNewQualificationForm.patchValue(data.data);
        this.isCreateQualificationItem = 'visible';
        //this.selectedTreeArr = data.data.hierarchy_units;
      }
      this.clickOutside = true;
    }));
  }
  getUniqueCode(nameValue){
    let programDetails = JSON.parse(this.storageService.get('NewProgramData'));
    let programId = programDetails?.['program_req_id'];
    const payload= {
      "name":nameValue
    }
    if(nameValue){
      this.subscriptions.push(this._programService.post(`/configurator/programs/${programId}/qualification-types/${this.qualificationId}/unique-id`,payload).subscribe(
        (data:any) => {
          if (data) {
            this.addNewQualificationForm.get('code').setValue(data.unique_id);
          }
        },
        (err) => {
          this._alertService.error(errorHandler(err));
        }));
    }
  }
  //get status of form fields
  get name() { return this.addNewQualificationForm.get('name'); }
  get is_enabled() { return this.addNewQualificationForm.get('is_enabled'); }
  get code() { return this.addNewQualificationForm.get('code'); }
  //get hierarchy_units(){  return this.addNewQualificationForm.get('hierarchy_units');}

  // getting Qualification  , bulk select and select from system options get values
  getDropdownData() {
    let qualificationTypeId;
    this.subscriptions.push(this.activatedRoute.queryParams.subscribe((param:any) => {
      qualificationTypeId = param['id'];
    }));
    let programDetails = JSON.parse(this.storageService.get('NewProgramData'));
    let programId = programDetails['program_req_id'];
    this.subscriptions.push(this._programService.get(`/configurator/programs/${programId}/qualification-types/${qualificationTypeId}/qualifications?dd=1`).subscribe(
      (data:any) => {
        if (data) {
          this.SelectFromSystem = data.qualifications;
          this.SelectFromSystem.forEach(element => {
            element['checked'] = false;
          });
        }
      },
      (err) => {
        this._alertService.error(errorHandler(err));
      }));
  }
  onIndexChange(event) {
    this.tabIndex = event;
    if (this.tabIndex == 0) {
      this.basicInfo = true;
    }
    else if (this.tabIndex == 1) {
      this.basicInfo = false;
    }
  }
  goToNext() {
    this.onIndexChange(1)
  }
  sidebarClose(event) {
    if (event) {
      this.eventStream.emit(new EmitEvent(Events.CREATE_QUALIFICATION_ITEM, false));
      this.formReSet();
      if (this.isUpdateReq) {
        this.eventStream.emit(new EmitEvent(Events.EDIT_QUALIFICATION_ITEM, false));
        this.formReSet();
        this.isCreateQualificationItem = 'hidden';
      }
    }
    else {
      if (this.isViewMode && !this.isUpdateReq) {
        this.eventStream.emit(new EmitEvent(Events.QUALIFICATION_ITEM_VIEW, false));
        this.formReSet();
        this.isCreateQualificationItem = 'hidden';
      }
      else if (this.isViewMode && this.isUpdateReq) {
        //do nothing
      }
    }
  }
  formReSet() {
    this.addNewQualificationForm.reset();
    this.toggle.value = true;
    this.tabIndex = 0;
    this.title = "";
    this.isViewMode = false;
    this.isUpdateReq = false;
    this.isCreate = true;
    this.toggle.title = 'active';
    this.selectedTreeArr = [];
    this.qualificationSource = "new";
    this.addNewQualificationForm.get('is_enabled').setValue(this.toggle.value);
    this.onClose.emit(true);
  }
  onClickToggle() {
    if (this.toggle.value) {
      this.toggle.value = false;
      this.toggle.title = 'inactive';
    } else {
      this.toggle.value = true;
      this.toggle.title = 'active';
    }
    this.status = this.toggle.value;
    this.addNewQualificationForm.get('is_enabled').setValue(this.toggle.value);
  }
  //save qualification or update qualification from here
  saveQualificationItem() {
    let programDetails = JSON.parse(this.storageService.get('NewProgramData'));
    let programId = programDetails['program_req_id'];
    const addQualificationItem = this.addNewQualificationForm.value;
    const payLoad = {
      name: addQualificationItem.name,
      code: addQualificationItem.code,
      description: addQualificationItem.description ? addQualificationItem.description : '',
      is_enabled: addQualificationItem.is_enabled == true ? 'True' : 'False'
    }
    //hierarchy_units: this.selectedTreeArr ? this.selectedTreeArr : []
    if (this.addNewQualificationForm.valid) {
      if (this.isUpdateReq) {
        this.subscriptions.push(this._programService.put(`/configurator/programs/${programId}/qualification-types/${this.qualificationId}/qualifications/${this.toUPdateIteamId}`, payLoad).subscribe(
          (data:any) => {
            if (data) {
              this.isUpdateReq = false;
              this.isViewMode = false;
              this.isCreate = true;
              this.sidebarClose(true);
              this.selectedTreeArr = [];
              this._alertService.success(`You have updated qualification successfully.`);
              this.eventStream.emit(new EmitEvent(Events.EDIT_QUALIFICATION_ITEM, false));
            }
          },
          (err) => {
            this._alertService.error(errorHandler(err));
          }
        ));
      } else {
        this.subscriptions.push(this._programService.post(`/configurator/programs/${programId}/qualification-types/${this.qualificationId}/qualifications`, payLoad).subscribe(
          data => {
            if (data) {
              this.sidebarClose(true);
              this._alertService.success(`You have created qualification successfully.`);
              this.eventStream.emit(new EmitEvent(Events.CREATE_QUALIFICATION_ITEM, false));
            }
          },
          (err) => {
            this._alertService.error(errorHandler(err));
          }));
      }

    } else {
      this.addNewQualificationForm.markAllAsTouched();
      this._alertService.error('Please fill the required fields.', {});
    }
  }
  //get hierarchy available in this program
  hierarchyList() {
    let programDetails = JSON.parse(this.storageService.get('NewProgramData'));
    let programId = programDetails?.['program_req_id'];
    this.subscriptions.push(this._programService.get(`/configurator/programs/${programId}/hierarchy`).subscribe(
      (data:any) => {
        if (data) {
          this.rendererData = data.result[0].hierarchies;
        }
      }));
  }
  // if level is not present in selectedTreeArr then push it , else  remove it
  selectHierarchy(data) {
    if (data) {
      if (data.currentState) {
        if (this.selectedTreeArr.indexOf(data.levelData.id) == -1) {
          this.selectedTreeArr.push(data.levelData.id);
        }
        this.pushChildLevelSelected(data.levelData);
      } else {
        this.selectedTreeArr = this.selectedTreeArr.filter((level) => {
          return level != data.levelData.id
        });
      }
    }
  }
  // push the hierarchy ids which is present inside the current selected level
  //(recursive call for hierarchies array)
  pushChildLevelSelected(currentData) {
    if (currentData.hierarchies.length) {
      for (let i = 0; i < currentData.hierarchies.length; i++) {
        const child = currentData.hierarchies[i];
        if (this.selectedTreeArr.indexOf(child.id) == -1) {
          this.selectedTreeArr.push(child.id);
        }
        this.pushChildLevelSelected(child);
      }
    }
  }

  //
  CheckAllOptions() {
    if (this.SelectFromSystem.every(val => val.checked == true)) {
      this.SelectFromSystem.forEach(val => { val.checked = false });
      this.bulkCreateList.length = 0;
      this.checkedAll = false;
    }
    else {
      this.SelectFromSystem.forEach(val => { val.checked = true });
      this.bulkCreateList = [...this.SelectFromSystem];
      this.checkedAll = true;
    }
  }
  //will pass value in event to check for removal or add
  isAllSelected(e,event) {
    if(!e) {
      this.bulkCreateList.forEach((val,index) =>{
        if(val.id == event){
          this.bulkCreateList.splice(index, 1);
        }
      })
      this.checkedAll = false;
    }
    else if (this.SelectFromSystem.every(val => val.checked == true)) {
      this.checkedAll = true;
      this.bulkCreateList = [...this.SelectFromSystem];
    }
    else{
      this.SelectFromSystem.forEach((val) =>{
        if(val.id == event){
          this.bulkCreateList.push(val);
        }
      })
    }
  }
  checkCheckBoxvalue(event) {
    this.addNewQualificationForm.reset(this.addNewQualificationForm);
    this.SelectFromSystem.forEach(val => {
      val.checked = false;
    })
    this.hierarchyList();
    this.selectedTreeArr.length = 0;
    this.checkedAll = false;
    this.bulkCreateList.length = 0;
    this.toggle.title = 'Active';
    this.toggle.value = true;
    this.addNewQualificationForm.controls['is_enabled'].setValue(this.toggle.value);
  }
  // get form fields value when select from dropdown
  getValues(event) {
    this.addNewQualificationForm.controls['name'].setValue(event.name);
    this.addNewQualificationForm.controls['description'].setValue(event.description);
    this.addNewQualificationForm.controls['code'].setValue(event.code);
    this.addNewQualificationForm.controls['is_enabled'].setValue(event.is_enabled);
    if (event.is_enabled) {
      this.toggle.value = true;
      this.toggle.title = 'active';
    } else {
      this.toggle.value = false;
      this.toggle.title = 'inactive';
    }
  }
  // saving data in bulk create option
  saveBulkCreate() {
    let programDetails = JSON.parse(this.storageService.get('NewProgramData'));
    let programId = programDetails['program_req_id'];
    let qualifications = [];
    if (this.qualificationSource == 'bulk' && (this.bulkCreateList.length != 0)) {
      this.bulkCreateList.forEach(val => {
        let obj = {};
        obj['id'] = val.id;
        obj['is_enabled'] = val.is_enabled;
       // obj['hierarchy_units'] = val.hierarchy_units;
        qualifications.push(obj);
      })
      let data = { 'qualifications': qualifications };
      this.subscriptions.push(this._programService.post(`/configurator/programs/${programId}/qualification-types/${this.qualificationId}/qualifications/bulk`, data).subscribe(
        (data:any) => {
          if (data) {
            this.sidebarClose(true);
            this._alertService.success(`You have saved qualifications successfully.`);
            this.eventStream.emit(new EmitEvent(Events.CREATE_QUALIFICATION_ITEM, false));
          }
        },
        (err) => {
          this._alertService.error(errorHandler(err));
        }));
    }
  }

  onMoreLessClick(id: string, desc: string) {

    if (this.selectQualificationId === '') {
      this.selectQualificationId = id
      this.expandMore = true
    } else if (this.selectQualificationId === id) {
      this.expandMore = !this.expandMore
    } else if (this.selectQualificationId !== id) {
      this.selectQualificationId = id
      this.expandMore = true
    }
  }
  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
