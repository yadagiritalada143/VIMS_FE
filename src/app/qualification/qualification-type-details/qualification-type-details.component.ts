import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { EventStreamService, EmitEvent, Events } from 'src/app/core/services/event-stream.service';
import { Validators, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-qualification-type-details',
  templateUrl: './qualification-type-details.component.html',
  styleUrls: ['./qualification-type-details.component.scss']
})
export class QualificationTypeDetailsComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  @Input() createQualificationType = 'hidden';
  @Input() isViewClicked;
  title: string ="";
  @Output() onClose = new EventEmitter();
  tabIndex = 0;
  basicInfo = true;
  public status;
  public toggle = {
    title: 'Status',
    value: true
  };

  public addQualificationTypeForm: UntypedFormGroup;
  isUpdateReq: boolean =false;
  isViewMode: boolean =false;
  rendererData: any;
  selectedTreeArr: any;

  constructor(private eventStream: EventStreamService,
    private fb: UntypedFormBuilder) { }

  ngOnInit(): void {
    this.addQualificationTypeForm = this.fb.group({
      name: ['',Validators.required],
      description: [''],
      is_enabled:[true,Validators.required],
      hierarchy_levels:[],
    })
     //View Qualification Type 
     this.subscriptions.push(this.eventStream.on(Events.SYSTEM_QUALIFICATION_TYPE_VIEW).subscribe( (data) => {
        if(data.event){
          this.title = `${data.data.name} detail view`;
          this.toggle.value = data.data.is_enabled;
          this.toggle.title = data.data.is_enabled == true ? 'active' : 'inactive';
          this.createQualificationType = 'visible';
          this.addQualificationTypeForm.patchValue(data.data);
          this.isViewMode = true;
        }else{
          this.createQualificationType = 'hidden';
        }
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
  sidebarClose() {
    let obj = { "event": false, "data": {} };
    this.eventStream.emit(new EmitEvent(Events.SYSTEM_QUALIFICATION_TYPE_VIEW, obj));
    this.addQualificationTypeForm.reset();
    this.isViewMode = false;
    this.toggle.value = true;
    this.tabIndex = 0;
    this.toggle.title = 'active';
    this.addQualificationTypeForm.get('is_enabled').setValue(this.toggle.value);
  }

  onClickToggle() {
    if (this.toggle.value) {
      this.toggle.value = false;
      this.toggle.title = 'inactive';
    } else {
      this.toggle.value = true;
      this.toggle.title = 'active';
    }
    this.addQualificationTypeForm.get('is_enabled').setValue(this.toggle.value);
    this.status = this.toggle.value;
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
