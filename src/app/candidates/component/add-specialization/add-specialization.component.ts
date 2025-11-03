import { Component, Input, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import {
  EventStreamService,
  Events
} from 'src/app/core/services/event-stream.service';
import { CandidateService } from '../../service/candidate.service';
import { Subscription,Subject} from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
@Component({
    selector: 'app-add-specialization',
    templateUrl: './add-specialization.component.html',
    styleUrls: ['./add-specialization.component.scss']
  })
export class AddSpecializationComponent implements OnInit, OnDestroy {
  @Output() specialityData: EventEmitter<any> = new EventEmitter<any>();
  closePanel: EventEmitter<boolean> = new EventEmitter();
  @Input() specialityTypeId;
  specialityList = [];
  specialityListLoading: boolean = false;
  addSpecialities = "hidden";
  panelHeading = 'Add New Speciality';
  public addSpecialitiesForm: UntypedFormGroup;
  editPanel = false;
  clickedIndex ;
  public input$ = new Subject<string | null>();
  oldUploadfileArr=[];
  newUploadfileArr=[];
  newfiles=[];
  btnText='Save';
  logs:Log = undefined;
  editQualificationId:Number;
  private subscrptions: Subscription[] = [];
  constructor(
    private fb: UntypedFormBuilder,
    private eventStream: EventStreamService,
    private candidateService : CandidateService
  ) {

  }

  AddEditHandler(data) {
    if (data.value) {
      this.addSpecialities = 'visible';
      if(data.obj != null){
        this.editQualificationId=data?.obj?.id;
        let updatefileobject=[];
        let newupdatefileobject=[];
        if(data?.obj?.files && data?.obj?.files.length >0 ){
          data.obj.files.forEach(element => {
            if(element.url){
              updatefileobject.push({filename:element.filename,ext:element?.filename.split('.').pop(),size:0,id:element?.id,url:element?.url,time:'03/31/2021'}); 
            }else{
              newupdatefileobject.push({name:element.filename,raw:element.raw,ext:element.ext,size:element.size,time:element.time})
            }        
          });
        }
  
        this.oldUploadfileArr=updatefileobject;
        this.newUploadfileArr=newupdatefileobject;
        this.updatePanel(data.obj);
        this.panelHeading = 'Edit Speciality';
        this.editPanel = true;
        this.clickedIndex = data.obj.clickedIndex;
      }
    } else {
      this.addSpecialities = 'hidden';
    }
  }
  ngOnInit(): void {
    this.subscrptions.push(this.eventStream.on(Events.ADD_CANDIDATE_SPECIALIZATION).subscribe((data) => {
      this.AddEditHandler(data);
    }));
    this.subscrptions.push(this.eventStream.on(Events.EDIT_CANDIDATE_SPECIALIZATION).subscribe((data) => {
      this.AddEditHandler(data);
    }));
    this.getSpecialities();

    this.input$.pipe(debounceTime(1000)).subscribe((newTerm) => {

      if(newTerm){
        this.getSpecialities(1, newTerm);
      }
    });
    this.addSpecialitiesForm = this.fb.group({
      specialityType: [null, Validators.required],
      experienceLevel: [null, Validators.required],
      description: [null, ''],
      notes: [null, ''],
      files:[null,'']
    });
  }
  uploadFiles(event){
  
    let filedata=[] ;
    if(event){
      event.forEach(element => {
        filedata.push({
          filename: element?.name ,
          raw : element?.raw,
          ext : element?.ext,
          size : element?.size,
          time : element?.time
        })
      });
    }
    
    this.newfiles=filedata;

    if(this.oldUploadfileArr && this.oldUploadfileArr.length>0){
      filedata=[ ...filedata, ...this.oldUploadfileArr];
    }

    this.addSpecialitiesForm.patchValue({
      files:filedata
    })
  }

 

  updateoldFiles(event){
    this.oldUploadfileArr=event;
    let filedata=[] ;
    event.forEach(element => {
      if(element?.id){
        filedata.push({
          filename: element?.filename ,
          id: element?.id ,
          url: element?.url ,
        })
      }
    })
    if(this.newfiles && this.newfiles.length>0){
      filedata=[ ...this.newfiles, ...this.oldUploadfileArr];
    }
    this.addSpecialitiesForm.patchValue({
      files:filedata
    })
  }
  sidebarClose() {
    this.addSpecialities = 'hidden';
    this.addSpecialitiesForm.reset();
    this.panelHeading = 'Add New Speciality';
    this.editPanel = false;
    this.logs=undefined;
    this.closePanel.emit(true);
  }
  getSpecialities(pageNo = 1,name=''){
    const specialityId = this.specialityTypeId;
    this.specialityListLoading = true;
    this.subscrptions.push(this.candidateService._getQualiFicationType(specialityId, pageNo = 1, name).subscribe({
      next: (res: any) => {
        this.specialityList = res.qualifications;
        this.specialityListLoading = false;
      },
      error: (err) => {
        this.showError(err);
        this.specialityListLoading = false;
      }
    }));
  }
  updatePanel(data){
    if(this.specialityList && this.specialityList.length>0 && (data && data.qualification_id)){
      let indx=this.specialityList.findIndex(cert=>cert.id===data?.qualification_id);
      if(indx===-1){
        this.candidateService.getQualificationsDetails(data?.qualification_id, this.specialityList).subscribe({
          next: (res: any) => {
            this.specialityList.push(res.qualification);
          },
          error: (err) => {
            this.showError(err);
          }
        }
        ); 
      }
    }
    this.addSpecialitiesForm.patchValue({
      specialityType: data.qualification_id,
      experienceLevel: data.experience_level,
      description: data.description,
      notes: data.notes,
      files: data.files
    })
  }
  saveSkill(action){
    this.logs=undefined;
    if(this.addSpecialitiesForm.valid){
      let data = this.addSpecialitiesForm.value;
      const specType = this.specialityList.filter((item)=>{
        if(item.id == data.specialityType){
          return item.name;
        }
      }).map((obj)=>{
          return obj.name;
      })
      const payload={
        qualification_id: data.specialityType,
        experience_level: data.experienceLevel,
        description: data.description,
        notes:data.notes,
        files:data.files,
        speciality_name: specType
      }
      if(this.editPanel) {
        payload['id']=this.editQualificationId;
      }

      this.specialityData.emit({payload: payload, isEdit:this.editPanel, clickedIndex: this.clickedIndex});
      this.addSpecialitiesForm.reset();
      if(action == 'save'){
        this.sidebarClose();
      }else{
        this.editPanel = false;
        this.panelHeading = 'Add New Speciality';
        this.closePanel.emit(true);
      }
    }else{
      // this.alertService.error('Please fill the required fields properly.');
      this.showError('Please fill the required fields properly.');
    }
  }
  ngOnDestroy(): void {
    this.subscrptions?.forEach(sub => sub.unsubscribe());
  }

  showError(err){
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message ? err?.error?.error?.message : (typeof err == 'string' ? err : ''), messages: [], autoClose: true, isShown: true, showReportButton: (err?.status == 500 || err?.status == 400), additionalInfo:{trace_id: err?.error?.trace_id } 
    };
      err?.error?.error?.errors?.forEach(msg => {      
        if (msg?.message) {      
          this.logs.messages.push(msg?.message);
        }
      });
  }
}