import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { EventStreamService, EmitEvent, Events } from 'src/app/core/services/event-stream.service';
import {  Validators, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-qualifications-details',
  templateUrl: './qualifications-details.component.html',
  styleUrls: ['./qualifications-details.component.scss']
})
export class QualificationsDetailsComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  @Input() isCreateQualificationItem = 'hidden';
  @Input() isViewClicked;
  //@Output() onClose = new EventEmitter();
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

  constructor(private eventStream: EventStreamService,
    private fb: UntypedFormBuilder,
    private activatedRoute: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    let name;
    this.subscriptions.push(this.activatedRoute.queryParams.subscribe(param => {
      this.qualificationId = param['id'];
      name = `Add New ${param['name']}`;
    }));
    // Qualification form with required field
    this.addNewQualificationForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      code: ['', Validators.required],
      is_enabled: [true, Validators.required],
      hierarchy_units: this.selectedTreeArr

    })
    // for view Qualification item
    this.subscriptions.push(this.eventStream.on(Events.QUALIFICATION_ITEM_VIEW).subscribe((data: any) => {
      if (data.event) {
        this.toggle.title = data.data.is_enabled == true ? 'active' : 'inactive';
        this.toggle.value = data.data.is_enabled;
        this.title = `${data.data.name} detail view`;
        this.isViewMode = true;
        this.isUpdateReq = false;
        this.addNewQualificationForm.patchValue(data.data);
        this.isCreateQualificationItem = 'visible';
        this.selectedTreeArr = data.data.hierarchy_units;
      }
    }));
  }
  //get status of form fields
  get name(){  return this.addNewQualificationForm.get('name');}
  get is_enabled(){  return this.addNewQualificationForm.get('is_enabled');}
  get code(){  return this.addNewQualificationForm.get('code');}
 // get hierarchy_units(){  return this.addNewQualificationForm.get('hierarchy_units');}

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
        this.eventStream.emit(new EmitEvent(Events.QUALIFICATION_ITEM_VIEW, false));
        this.formReSet();
        this.isCreateQualificationItem = 'hidden';

  }
    formReSet(){
     this.addNewQualificationForm.reset();
     this.toggle.value = true;
      this.tabIndex = 0;
     this.title = "";
     this.isViewMode = false;
      this.isUpdateReq = false;
      this.toggle.title = 'active';
      this.selectedTreeArr = [];
      this.addNewQualificationForm.get('is_enabled').setValue(this.toggle.value);
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
  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
