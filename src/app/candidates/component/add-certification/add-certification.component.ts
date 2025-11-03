import { Component, OnInit, Output, EventEmitter, ViewChild, Input, OnDestroy } from '@angular/core';
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
  selector: 'app-add-certification',
  templateUrl: './add-certification.component.html',
  styleUrls: ['./add-certification.component.scss']
})
export class AddCertificationComponent implements OnInit, OnDestroy {
  profilevisible = true;
  helpVisible = true;
  certificateLoading: boolean = false;
  @Output() certificateData: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('initialDate') initialDate: SvmsDatepickerComponent;
  @ViewChild('recertiDate') recertiDate: SvmsDatepickerComponent;
  @ViewChild('expiryDate') expiryDate: SvmsDatepickerComponent;
  closePanel: EventEmitter<boolean> = new EventEmitter();
  @Input() certificationTypeId;
  addCertificate = "hidden";
  certificationTypeList = [];
  oldUploadfileArr = [];
  newUploadfileArr = [];
  newfiles = [];
  public addCertificateForm: UntypedFormGroup;
  panelHeading = 'Add New Certification';
  btnText = 'Save'
  editPanel = false;
  clickedIndex;
  fileupdate = false;
  public input$ = new Subject<string | null>();
  re_certification_options: any = {
    language: 'English',
    timepicker: true,
    format12h: true,
    range: false,
    enabledDateRanges: [
    ]
  };
  expiration_options: any = {
    language: 'English',
    timepicker: true,
    format12h: true,
    range: false,
    enabledDateRanges: [
    ]
  };
  logs:Log = undefined;
  private subscrptions: Subscription[] = [];
  editQualificationId:Number;
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
      this.addCertificate = 'visible';
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
        this.panelHeading = 'Edit Certification';
        this.btnText = 'Save';
        this.editPanel = true;
        this.clickedIndex = data.obj.clickedIndex;

      }
    } else {
      this.addCertificate = 'hidden';
    }
  }



  ngOnInit(): void {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.defaultDateFormat = currentProgram.defaultDateFormat?.toUpperCase();
    this.addCertificateForm = this.fb.group({
      type: [null, Validators.required],
      authority: [null, Validators.required],
      initialDate: [null, Validators.required],
      reCertificationDate: [null, ''],
      expiryDate: [null, ''],
      id: [null, ''],
      notes: [null, ''],
      files: [null, '']
    });
    this.subscrptions.push(this.addCertificateForm.get('initialDate').valueChanges.subscribe((data) => {
      if (data) {
        const initial_date = this.datePipe.transform(data, DATE_FORMAT?.FORMATMDY, null, null, true, this.defaultDateFormat);
        const date = new Date(initial_date);
        date.setDate(date.getDate() + 1);

        this.re_certification_options = {
          language: 'English',
          timepicker: true,
          format12h: true,
          range: false,
          enabledDateRanges: [{ start: date }
          ]
        };
        this.expiration_options = {
          language: 'English',
          timepicker: true,
          format12h: true,
          range: false,
          enabledDateRanges: [{ start: date }
          ]
        };
        this.addCertificateForm.get('reCertificationDate').patchValue('');
        this.addCertificateForm.get('expiryDate').patchValue('');
      }
    }));

    this.addCertificateForm.get('reCertificationDate').valueChanges.subscribe((data) => {
      if (data) {
        const re_certification_date = this.datePipe.transform(data, DATE_FORMAT?.FORMATMDY, null, null, true, this.defaultDateFormat);
        const date = new Date(re_certification_date);
        date.setDate(date.getDate() + 1);
        this.expiration_options = {
          language: 'English',
          timepicker: true,
          format12h: true,
          range: false,
          enabledDateRanges: [{ start: date }
          ]
        };
        this.addCertificateForm.get('expiryDate').patchValue('');
      }
    });

    this.subscrptions.push(this.eventStream.on(Events.ADD_CANDIDATE_CERTIFICATION).subscribe((data) => {
      this.AddEditHandler(data);

    }));
    this.subscrptions.push(this.eventStream.on(Events.EDIT_CANDIDATE_CERTIFICATION).subscribe((data) => {
      this.AddEditHandler(data);
    }));
    this.getCertificates();
    this.input$.pipe(debounceTime(1000)).subscribe((newTerm) => {

      if(newTerm){
        this.getCertificates(1, newTerm);
      }
    });
  }
  getCertificates(pageNo = 1,name='') {
    this.certificateLoading = true;
    const certificationId = this.certificationTypeId;
    this.candidateService._getQualiFicationType(certificationId, pageNo = 1, name).subscribe({
      next: (res: any) => {
        this.certificateLoading = false;
        this.certificationTypeList = res.qualifications;
      },
      error: (err) => {
        this.certificateLoading = false;
        // this.alertService.error(errorHandler(err));
        this.showError(err);
      }
    }
   )
  }
  sidebarClose() {
    this.addCertificate = 'hidden';
    this.addCertificateForm.reset();
    this.panelHeading = 'Add New Certification';
    this.editPanel = false;
    this.initialDate.value = null;
    this.expiryDate.value = null;
    this.recertiDate.value = null;
    this.logs=undefined;
    this.closePanel.emit(true);
  }
  uploadFiles(event) {
    let filedata = [];
    this.fileupdate = true
    if (event) {
      event.forEach(element => {
        filedata.push({
          filename: element?.name,
          raw: element?.raw,
          ext: element?.ext,
          size: element?.size,
          time: element?.time
        })

      });
    }
    this.newfiles = filedata;

    if (this.oldUploadfileArr && this.oldUploadfileArr.length > 0) {
      filedata = [...filedata, ...this.oldUploadfileArr];
    }

    this.addCertificateForm.patchValue({
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
    this.addCertificateForm.patchValue({
      files: filedata
    })
  }
  updatePanel(data) {

    if(this.certificationTypeList && this.certificationTypeList.length>0 && (data && data.qualification_id)){
      let indx=this.certificationTypeList.findIndex(cert=>cert.id===data?.qualification_id);
      if (indx === -1) {
        this.candidateService.getQualificationsDetails(data?.qualification_id, this.certificationTypeId).subscribe({
          next: (res: any) => {
            this.certificationTypeList.push(res.qualification);
          },
          error: (err) => {
            // this.alertService.error(errorHandler(err));
            this.showError(err);
          }
        }
        );
      }
    }
    this.addCertificateForm.patchValue({
      type: data.qualification_id,
      authority: data.authority,
      initialDate: data.initial_date ? this.datePipe.transform(data.initial_date, this.defaultDateFormat, null, null, true, DATE_FORMAT?.FORMATMDY) : null,
      reCertificationDate: data.re_issue_date ? this.datePipe.transform(data.re_issue_date, this.defaultDateFormat, null, null, true, DATE_FORMAT?.FORMATMDY) : null,
      expiryDate: data.expiration_date ? this.datePipe.transform(data.expiration_date, this.defaultDateFormat, null, null, true, DATE_FORMAT?.FORMATMDY) : null,
      id: data.certification_id,
      notes: data.notes,
      files: data.files
    })
  }
  saveCertification(action) {
    this.logs=undefined;
    let data = this.addCertificateForm.value;
    const certiType = this.certificationTypeList.filter((item) => {
      if (item.id == data.type) {
        return item.name;
      }
    }).map((obj) => {
      return obj.name;
    })

    if (this.addCertificateForm.valid) {
      const payload = {
        qualification_id: data.type,
        authority: data.authority,
        initial_date: data.initialDate ? this.datePipe.transform(data.initialDate, DATE_FORMAT?.FORMATMDY, null, null, true, this.defaultDateFormat) : null, 
        re_issue_date: data.reCertificationDate ? this.datePipe.transform(data.reCertificationDate, DATE_FORMAT?.FORMATMDY, null, null, true, this.defaultDateFormat) : null,
        expiration_date: data.expiryDate ? this.datePipe.transform(data.expiryDate, DATE_FORMAT?.FORMATMDY, null, null, true, this.defaultDateFormat) : null,
        certification_id: data.id,
        notes: data.notes,
        files: data.files,
        certification_name: certiType
      }
      if(this.editPanel) {
        payload['id']=this.editQualificationId;
      }

      this.certificateData.emit({ payload: payload, isEdit: this.editPanel, clickedIndex: this.clickedIndex });
      if (action == 'save') {
        this.sidebarClose();
      } else {
        this.editPanel = false;
        this.panelHeading = 'Add New Certification';
        this.initialDate.value = null;
        this.expiryDate.value = null;
        this.recertiDate.value = null;
        this.closePanel.emit(true);
      }
      this.addCertificateForm.reset();
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
