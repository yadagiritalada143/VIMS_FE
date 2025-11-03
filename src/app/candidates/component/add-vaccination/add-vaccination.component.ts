import { Component, Output, OnInit, EventEmitter, ViewChild, Input, OnDestroy } from '@angular/core';
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
  selector: 'app-add-vaccination',
  templateUrl: './add-vaccination.component.html',
  styleUrls: ['./add-vaccination.component.scss']
})
export class AddVaccinationComponent implements OnInit, OnDestroy {
  private subscrptions: Subscription[] = [];
  @Output() vaccinationData: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('initialDate') initialDate: SvmsDatepickerComponent;
  @ViewChild('expiryDate') expiryDate: SvmsDatepickerComponent;
  closePanel: EventEmitter<boolean> = new EventEmitter();
  @Input() vaccineTypeId;
  addVaccinations = "hidden";
  vaccinationList = [];
  vaccinationListLoading: boolean = false;
  panelHeading = 'Add New Vaccination';
  public addVaccinationsForm: UntypedFormGroup;
  clickedIndex;
  oldUploadfileArr = [];
  newUploadfileArr = [];
  newfiles = [];
  editPanel = false;
  btnText = 'Save';
  public input$ = new Subject<string | null>();
  logs:Log = undefined;
  editQualificationId:Number;

  vaccination_expiration_options: any = {
    language: 'English',
    timepicker: true,
    format12h: true,
    range: false,
    enabledDateRanges: [
    ]
  };
  defaultDateFormat;

  constructor(
    private fb: UntypedFormBuilder,
    private eventStream: EventStreamService,
    private candidateService: CandidateService,
    private storageService: StorageService,
    private datePipe: LocalDateFormatPipe
  ) { }

  AddEditHandler(data) {
    if (data.value) {
      this.addVaccinations = 'visible';
      if (data.obj != null) {
        this.editQualificationId=data?.obj?.id;
        let updatefileobject = [];
        let newupdatefileobject = [];
        if (data?.obj?.files && data?.obj?.files.length > 0) {
          data.obj.files.forEach(element => {
            if (element.url) {
              updatefileobject.push({ filename: element.filename, ext: element?.filename.split('.').pop(), size: 0, id: element?.id, url: element?.url, time: '03/31/2021' });
            } else {
              newupdatefileobject.push({ name: element.filename, raw: element.raw, ext: element.ext, size: element.size, time: element.time })
            }
          });
        }

        this.oldUploadfileArr = updatefileobject;
        this.newUploadfileArr = newupdatefileobject;
        this.updatePanel(data.obj);
        this.panelHeading = 'Edit Vaccination';
        this.btnText = 'Save';
        this.editPanel = true;
        this.clickedIndex = data.obj.clickedIndex;
      }
    } else {
      this.addVaccinations = 'hidden';
    }
  }
  ngOnInit(): void {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.defaultDateFormat = currentProgram.defaultDateFormat?.toUpperCase();
    this.subscrptions.push(this.eventStream.on(Events.ADD_CANDIDATE_VACCINATOIN).subscribe((data) => {
      this.AddEditHandler(data);
    }));
    this.subscrptions.push(this.eventStream.on(Events.EDIT_CANDIDATE_VACCINATOIN).subscribe((data) => {
      this.AddEditHandler(data);
    }));
    this.getVaccinations();
    this.input$.pipe(debounceTime(1000)).subscribe((newTerm) => {

      if(newTerm){
        this.getVaccinations(1, newTerm);
      }
    });
    this.addVaccinationsForm = this.fb.group({
      vaccinationType: [null, Validators.required],
      vaccinationProvider: [null, Validators.required],
      vaccinationDate: [null, Validators.required],
      vaccinationExpiryDate: [null, Validators.required],
      vaccinationNumbr: [null, Validators.required],
      notes: [null, ''],
      files: [null, '']
    });

    this.subscrptions.push(this.addVaccinationsForm.get('vaccinationDate').valueChanges.subscribe((data) => {
      if (data) {
        const vaccination_date = this.datePipe.transform(data, DATE_FORMAT?.FORMATMDY, null, null, true, this.defaultDateFormat);
        const date = new Date(vaccination_date);
        date.setDate(date.getDate() + 1);
        this.vaccination_expiration_options = {
          language: 'English',
          timepicker: true,
          format12h: true,
          range: false,
          enabledDateRanges: [
            { start: date }
          ]
        };
        this.addVaccinationsForm.get('vaccinationExpiryDate').patchValue('');
      }
    }));
  }
  sidebarClose() {
    this.addVaccinations = 'hidden';
    this.addVaccinationsForm.reset();
    this.panelHeading = 'Add New Vaccination';
    this.editPanel = false;
    this.logs=undefined;
    this.closePanel.emit(true);
  }
  getVaccinations(pageNo = 1,name='') {
    this.vaccinationListLoading = true;
    const vaccineId = this.vaccineTypeId;
    this.subscrptions.push(this.candidateService._getQualiFicationType(vaccineId, pageNo = 1, name).subscribe({
      next: (res: any) => {
        this.vaccinationList = res.qualifications;
        this.vaccinationListLoading = false;
      },
      error: (err) => {
        this.showError(err);
      }
    }
    ));
  }
  uploadFiles(event) {

    let filedata = [];
    if (event) {
      event.forEach(element => {
        filedata.push({
          filename: element?.name,
          raw: element?.raw,
          ext: element?.ext,
          size: element?.size,
          time: element?.time,
        })
      });
    }
    this.newfiles = filedata;
    if (this.oldUploadfileArr && this.oldUploadfileArr.length > 0) {
      filedata = [...filedata, ...this.oldUploadfileArr];
    }


    this.addVaccinationsForm.patchValue({
      files: filedata
    })
  }

  updateoldFiles(event) {
    this.oldUploadfileArr = event;
    let filedata = [];
    event.forEach(element => {
      if (element?.id) {
        filedata.push({
          filename: element?.filename,
          id: element?.id,
          url: element?.url,
        })
      }
    })
    if (this.newfiles && this.newfiles.length > 0) {
      filedata = [...this.newfiles, ...this.oldUploadfileArr];
    }
    this.addVaccinationsForm.patchValue({
      files: filedata
    })
  }
  updatePanel(data) {

    if(this.vaccinationList && this.vaccinationList.length>0 && (data && data.qualification_id)){
      let indx=this.vaccinationList.findIndex(skill=>skill.id===data?.qualification_id);
      if(indx===-1){

        this.candidateService.getQualificationsDetails(data?.qualification_id, this.vaccineTypeId).subscribe({
          next: (res: any) => {
            this.vaccinationList.push(res.qualification);
          },
          error: (err) => {
            this.showError(err);
          }
        }); 
      }
    }
    this.addVaccinationsForm.patchValue({
      vaccinationType: data.qualification_id,
      vaccinationProvider: data.provider,
      vaccinationDate: data.vaccination_date ? this.datePipe.transform(data.vaccination_date, this.defaultDateFormat, null, null, true, DATE_FORMAT?.FORMATMDY) : null,
      vaccinationExpiryDate: data.expiration_date ? this.datePipe.transform(data.expiration_date, this.defaultDateFormat, null, null, true, DATE_FORMAT?.FORMATMDY) : null,
      vaccinationNumbr: data.credential_number,
      notes: data.notes,
      files: data.files
    })
  }
  saveVaccination(action) {
    this.logs=undefined;
    if (this.addVaccinationsForm.valid) {
      let data = this.addVaccinationsForm.value;
      const vaccType = this.vaccinationList.filter((item) => {
        if (item.id == data.vaccinationType) {
          return item.name;
        }
      }).map((obj) => {
        return obj.name;
      })
      const payload = {
        qualification_id: data.vaccinationType,
        provider: data.vaccinationProvider,
        vaccination_date: data.vaccinationDate ? this.datePipe.transform(data.vaccinationDate, DATE_FORMAT?.FORMATMDY, null, null, true, this.defaultDateFormat) : null,
        expiration_date: data.vaccinationExpiryDate ? this.datePipe.transform(data.vaccinationExpiryDate, DATE_FORMAT?.FORMATMDY, null, null, true, this.defaultDateFormat) : null,
        credential_number: data.vaccinationNumbr,
        notes: data.notes,
        files: data.files,
        vaccine_name: vaccType
      }
      if(this.editPanel) {
        payload['id']=this.editQualificationId;
      }

      this.vaccinationData.emit({ payload: payload, isEdit: this.editPanel, clickedIndex: this.clickedIndex });
      this.addVaccinationsForm.reset();
      this.initialDate.value = null;
      this.expiryDate.value = null;
      if (action == 'save') {
        this.sidebarClose();
      } else {
        this.editPanel = false;
        this.panelHeading = 'Add New Vaccination';
        this.closePanel.emit(true);
      }
    } else {
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
