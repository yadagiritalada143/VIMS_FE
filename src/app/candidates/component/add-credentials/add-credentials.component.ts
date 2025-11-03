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
  selector: 'app-add-credentials',
  templateUrl: './add-credentials.component.html',
  styleUrls: ['./add-credentials.component.scss']
})
export class AddCredentialsComponent implements OnInit, OnDestroy {
  @Output() credentialData: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('initialDate') initialDate: SvmsDatepickerComponent;
  @ViewChild('reIssueDate') reIssueDate: SvmsDatepickerComponent;
  @ViewChild('expiryDate') expiryDate: SvmsDatepickerComponent;
  closePanel: EventEmitter<boolean> = new EventEmitter();
  @Input() credentialTypeId;
  credentialList = [];
  credentialsLoading: boolean = false;
  addCredential = "hidden";
  oldUploadfileArr = [];
  newUploadfileArr = [];
  newfiles = [];
  public addCredentialForm: UntypedFormGroup;
  panelHeading = 'Add New Credential';
  editPanel = false;
  btnText = 'Save'
  clickedIndex;
  public input$ = new Subject<string | null>();
  re_issuing_options: any = {
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
  editQualificationId:Number;
  defaultDateFormat;
  private subscrptions: Subscription[] = [];
  constructor(
    private fb: UntypedFormBuilder,
    private eventStream: EventStreamService,
    private candidateService: CandidateService,
    private storageService: StorageService,
    private datePipe: LocalDateFormatPipe
  ) {

  }

  AddEditHandler(data) {
    if (data.value) {
      this.addCredential = 'visible';
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
        this.panelHeading = 'Edit Credential';
        this.btnText = 'Save';
        this.editPanel = true;
        this.clickedIndex = data.obj.clickedIndex;
      }
    } else {
      this.addCredential = 'hidden';
    }
  }
  ngOnInit(): void {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.defaultDateFormat = currentProgram.defaultDateFormat?.toUpperCase();

    this.subscrptions.push(this.eventStream.on(Events.ADD_CANDIDATE_CREDENTIAL).subscribe((data) => {
      this.AddEditHandler(data);
    }));
    this.subscrptions.push(this.eventStream.on(Events.EDIT_CANDIDATE_CREDENTIAL).subscribe((data) => {
      this.AddEditHandler(data);
    }));
    this.getCredentials();
    this.input$.pipe(debounceTime(1000)).subscribe((newTerm) => {

      if(newTerm){
        this.getCredentials(1, newTerm);
      }
    });
    this.addCredentialForm = this.fb.group({
      credentialType: [null, Validators.required],
      issuingAuthority: [null, Validators.required],
      initialIssuingDate: [null, Validators.required],
      reIssuingDate: [null, ''],
      credentialExpirationDate: [null, ''],
      credentialId: [null, ''],
      notes: [null, ''],
      files: [null, '']
    });
    this.subscrptions.push(this.addCredentialForm.get('initialIssuingDate').valueChanges.subscribe((data) => {
      if (data) {
        const initial_issuing_date = this.datePipe.transform(data, DATE_FORMAT?.FORMATMDY, null, null, true, this.defaultDateFormat);
        const date = new Date(initial_issuing_date);
        date.setDate(date.getDate() + 1);

        this.re_issuing_options = {
          language: 'English',
          timepicker: true,
          format12h: true,
          range: false,
          enabledDateRanges: [
            { start: date }
          ]
        };
        this.expiration_options = {
          language: 'English',
          timepicker: true,
          format12h: true,
          range: false,
          enabledDateRanges: [
            { start: date }
          ]
        };

        this.addCredentialForm.get('reIssuingDate').patchValue('');
        this.addCredentialForm.get('credentialExpirationDate').patchValue('');
      }
    }));
    this.subscrptions.push(this.addCredentialForm.get('reIssuingDate').valueChanges.subscribe((data) => {
      if (data) {
        const re_issuing_date = this.datePipe.transform(data, DATE_FORMAT?.FORMATMDY, null, null, true, this.defaultDateFormat);
        const date = new Date(re_issuing_date);
        date.setDate(date.getDate() + 1);

        this.expiration_options = {
          language: 'English',
          timepicker: true,
          format12h: true,
          range: false,
          enabledDateRanges: [

            { start: date }
          ]
        };
        this.addCredentialForm.get('credentialExpirationDate').patchValue('');
      }
    }));
  }

  sidebarClose() {
    this.addCredential = 'hidden';
    this.addCredentialForm.reset();
    this.panelHeading = 'Add New Credential';
    this.editPanel = false;
    this.logs=undefined;
    this.closePanel.emit(true);
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
          time: element?.time
        })
      });
    }

    this.newfiles = filedata;


    if (this.oldUploadfileArr && this.oldUploadfileArr.length > 0) {
      filedata = [...filedata, ...this.oldUploadfileArr];
    }

    this.addCredentialForm.patchValue({
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
    });

    if (this.newfiles && this.newfiles.length > 0) {
      filedata = [...this.newfiles, ...this.oldUploadfileArr];
    }
    this.addCredentialForm.patchValue({
      files: filedata
    })
  }

  getCredentials(pageNo = 1,name='') {
    this.credentialsLoading =  true;
    const credentialId = this.credentialTypeId;
    this.candidateService._getQualiFicationType(credentialId, pageNo = 1, name).subscribe({
      next: (res: any) => {
        this.credentialList = res.qualifications;
        this.credentialsLoading =  false;
      },
      error: (err) => {
        // this.alertService.error(errorHandler(err));
        this.showError(err);
        this.credentialsLoading = false;
      }
    }
    )
  }
  updatePanel(data) {
    if(this.credentialList && this.credentialList.length>0 && (data && data.qualification_id)){
      let indx=this.credentialList.findIndex(cert=>cert.id===data?.qualification_id);
      if (indx === -1) {
        this.candidateService.getQualificationsDetails(data?.qualification_id, this.credentialTypeId).subscribe({
          next: (res: any) => {
            this.credentialList.push(res.qualification);
          },
          error: (err) => {
            // this.alertService.error(errorHandler(err));
            this.showError(err);
          }
        }
        );
      }
    }
    this.addCredentialForm.patchValue({
      credentialType: data.qualification_id,
      issuingAuthority: data.issuing_authority,
      initialIssuingDate: data.initial_issue_date ? this.datePipe.transform(data.initial_issue_date, this.defaultDateFormat, null, null, true, DATE_FORMAT?.FORMATMDY) : null,
      reIssuingDate: data.re_issue_date ? this.datePipe.transform(data.re_issue_date, this.defaultDateFormat, null, null, true, DATE_FORMAT?.FORMATMDY) : null,
      credentialExpirationDate: data.expiration_date ? this.datePipe.transform(data.expiration_date, this.defaultDateFormat, null, null, true, DATE_FORMAT?.FORMATMDY) : null,
      credentialId: data.credential_id,
      notes: data.notes,
      files: data.files
    })
  }
  saveCredential(action) {
    this.logs=undefined;
    let data = this.addCredentialForm.value;
    const credentialType = this.credentialList.filter((item) => {
      if (item.id == data.credentialType) {
        return item.name;
      }
    }).map((obj) => {
      return obj.name;
    })
    if (this.addCredentialForm.valid) {
      const payload = {
        qualification_id: data.credentialType,
        issuing_authority: data.issuingAuthority,
        initial_issue_date: data.initialIssuingDate ? this.datePipe.transform(data.initialIssuingDate, DATE_FORMAT?.FORMATMDY, null, null, true, this.defaultDateFormat) : null,
        re_issue_date: data.reIssuingDate ? this.datePipe.transform(data.reIssuingDate, DATE_FORMAT?.FORMATMDY, null, null, true, this.defaultDateFormat) : null,
        expiration_date: data.credentialExpirationDate ? this.datePipe.transform(data.credentialExpirationDate, DATE_FORMAT?.FORMATMDY, null, null, true, this.defaultDateFormat) : null,
        credential_id: data.credentialId,
        notes: data.notes,
        files: data.files,
        credential_name: credentialType
      }
      
      if(this.editPanel) {
        payload['id']=this.editQualificationId;
      }

      this.credentialData.emit({ payload: payload, isEdit: this.editPanel, clickedIndex: this.clickedIndex });
      if (action == 'save') {
        this.sidebarClose();
      } else {
        this.editPanel = false;
        this.panelHeading = 'Add New Credential';
        this.closePanel.emit(true);
      }
      this.addCredentialForm.reset();
      this.initialDate.value = null;
      this.expiryDate.value = null;
      this.reIssueDate.value = null;
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
