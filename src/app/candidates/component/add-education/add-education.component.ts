import { Component, Input, OnInit, Output, EventEmitter, ViewChild, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { CandidateService } from '../../service/candidate.service';
import { SvmsDatepickerComponent } from 'src/app/shared/components/svms-datepicker/svms-datepicker.component';
import { Subscription,Subject} from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
@Component({
    selector: 'app-add-education',
    templateUrl: './add-education.component.html',
    styleUrls: ['./add-education.component.scss']
})
export class AddEducationComponent implements OnInit, OnDestroy {
  @Output() educationData: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('startDate') startDate: SvmsDatepickerComponent;
  @ViewChild('endDate') endDate: SvmsDatepickerComponent;
  @Input() educationTypeId;
  closePanel: EventEmitter<boolean> = new EventEmitter();
  addEducation = "hidden";
  educationList =[];
  educationListLoading: boolean = false;
  public addEducationForm: UntypedFormGroup;
  panelHeading = 'Add New Education';
  editPanel = false;
  clickedIndex ;
  public input$ = new Subject<string | null>();
  oldUploadfileArr=[];
  newUploadfileArr=[];
  newfiles=[];
  btnText='Save';
  to_options: any={
    language: 'English',
    timepicker: true,
    format12h: true,
    range: false,
    enabledDateRanges: [     
    ]
  };
  logs:Log = undefined;
  editQualificationId:Number;
  defaultDateFormat;
  submitEducationError: boolean = false;
  private subscrptions: Subscription[] = [];

  constructor(
    private fb: UntypedFormBuilder,
    private eventStream: EventStreamService,
    private candidateService : CandidateService,
    private storageService: StorageService,
    private datePipe: LocalDateFormatPipe
  ) {

  }

  AddEditHandler(data) {
    if (data.value) {
      this.addEducation = 'visible';
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
        this.newUploadfileArr=newupdatefileobject
        this.updatePanel(data.obj);
        this.panelHeading = 'Edit Education';
        this.editPanel = true;
        this.btnText = 'Save';
        this.clickedIndex = data.obj.clickedIndex;
      }
    } else {
      this.addEducation = 'hidden';
    }
  }
  ngOnInit(): void {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.defaultDateFormat = currentProgram.defaultDateFormat?.toUpperCase();
    this.subscrptions.push(this.eventStream.on(Events.ADD_CANDIDATE_EDUCATION).subscribe((data) => {
      this.AddEditHandler(data);
    }));
    this.subscrptions.push(this.eventStream.on(Events.EDIT_CANDIDATE_EDUCATION).subscribe((data) => {
      this.AddEditHandler(data);
    }));
    this.getEducationList();
    this.input$.pipe(debounceTime(1000)).subscribe((newTerm) => {

      if(newTerm){
        this.getEducationList(1, newTerm);
      }
    });
    this.addEducationForm = this.fb.group({
      educationType: [null, Validators.required],
      institution: [null],
      degree: [null],
      major: [null],
      minor: [null, ''],
      from: [null],
      to: [null],
      gpa: [null],
      notes: [null, ''],
      files:[null, '']
    });

    this.subscrptions.push(this.addEducationForm.get('from').valueChanges.subscribe((data) => {
      if (data) {
        const from_date = this.datePipe.transform(data, DATE_FORMAT?.FORMATMDY, null, null, true, this.defaultDateFormat);
        let date = new Date(from_date);
        date.setDate(date.getDate() + 1);

        this.to_options={
          language: 'English',
          timepicker: true,
          format12h: true,
          range: false,
          enabledDateRanges: [     
            { start: date}
          ]
        };
        this.addEducationForm.get('to').patchValue('');
      }
    }));
  }
  updatePanel(data){
    if(this.educationList && this.educationList.length>0 && (data && data.qualification_id)){
      let indx=this.educationList.findIndex(skill=>skill.id===data?.qualification_id);
      if(indx===-1){

        this.candidateService.getQualificationsDetails(data?.qualification_id, this.educationTypeId).subscribe({
          next: (res: any) => {
            this.educationList.push(res.qualification);
          },
          error: (err) => {
            this.showError(err);
          }
        }
        ); 
      }
    }

    this.addEducationForm.patchValue({
      educationType: data.qualification_id,
      institution: data.institution,
      degree: data.degree,
      major: data.major,
      minor: data.minor,
      from: data.start_date ? this.datePipe.transform(data.start_date, this.defaultDateFormat, null, null, true, DATE_FORMAT?.FORMATMDY) : null,
      to: data.end_date ? this.datePipe.transform(data.end_date, this.defaultDateFormat, null, null, true, DATE_FORMAT?.FORMATMDY) : null,
      gpa: data.score,
      notes: data.notes,
      files:data.files
    })
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
          time : element?.time,
        })
      });
      
    }
    this.newfiles=filedata;
    if(this.oldUploadfileArr && this.oldUploadfileArr.length>0){
      filedata=[ ...filedata, ...this.oldUploadfileArr];
    }
    this.addEducationForm.patchValue({
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

    this.addEducationForm.patchValue({
      files:filedata
    })
  }
  sidebarClose() {
    this.addEducationForm.reset();
    this.addEducation = 'hidden';
    this.panelHeading = 'Add New Education';
    this.editPanel = false;
    this.logs=undefined;
    this.closePanel.emit(true);
  }
  getEducationList(pageNo = 1,name=''){
    this.educationListLoading =  true;
    const educationId = this.educationTypeId;
    this.subscrptions.push(this.candidateService._getQualiFicationType(educationId, pageNo = 1, name).subscribe({
      next: (res: any) => {
        this.educationList = res.qualifications;
        this.educationListLoading = false;
      },
      error: (err) => {
        // this.alertService.error(errorHandler(err));
        this.showError(err);
        this.educationListLoading = false;
      }
    }
    ));
  }
  saveEducation(action){
    this.submitEducationError = false;
    this.logs=undefined;
    let data = this.addEducationForm.value;
    const educationType = this.educationList.filter((item)=>{
      if(item.id == data.educationType){
        return item.name;
      }
    }).map((obj)=>{
        return obj.name;
    })
    if( this.addEducationForm.valid){
      const payload = {
        qualification_id: data.educationType,
        institution: data.institution,
        degree: data.degree ,
        major: data.major,
        minor: data.minor,
        start_date: data.from ? this.datePipe.transform(data.from, DATE_FORMAT?.FORMATMDY, null, null, true, this.defaultDateFormat) : null,
        end_date: data.to ? this.datePipe.transform(data.to, DATE_FORMAT?.FORMATMDY, null, null, true, this.defaultDateFormat) : null,
        score: data.gpa,
        notes: data.notes,
        files: data.files,
        education_name:educationType
      }
      if(this.editPanel) {
        payload['id']=this.editQualificationId;
      }
      this.educationData.emit({payload: payload, isEdit:this.editPanel, clickedIndex: this.clickedIndex});
      this.addEducationForm.reset();
      this.startDate.value = null;
      this.endDate.value = null;
      if(action == 'save'){
        this.sidebarClose();
      }else{
        this.editPanel = false;
        this.panelHeading = 'Add New Education';
        this.closePanel.emit(true);
      }
    }else{
      // this.alertService.error('Please fill the required fields properly.');
      this.submitEducationError = (!this.addEducationForm.controls.educationType.touched || !this.addEducationForm.controls.educationType.dirty) && this.addEducationForm.controls.educationType.invalid;
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
