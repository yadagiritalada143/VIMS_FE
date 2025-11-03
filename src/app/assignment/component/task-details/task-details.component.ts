import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ElementRef, HostListener, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { Tasks } from '../../assignment.model';
import { AssignmentService } from '../../assignment.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import HelloSign from "hellosign-embedded";
import { Subscription } from 'rxjs';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { UsersType } from 'src/app/shared/enums';
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import { Log , LOG_TYPE } from 'src/app/library/logs/logs.model';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { VendorType } from '../../enums/vendor-type';
import { UserType } from 'src/app/expense/enums/expense.enums';
@Component({
  selector: 'app-task-details',
  templateUrl: './task-details.component.html',
  styleUrls: ['./task-details.component.scss']
})
export class TaskDetailsComponent implements OnInit, OnDestroy {

  taskId: string = undefined;
  @Input() taskDetails = "hidden";
  @Input() taskDetailsData: Tasks;
  @Input() assignmentID;
  @Input() candidateID;
  @Input() assignmentStatus;
  dateFormat: any;
  @Input() set taskID(data) {
    // this.getTaskDetails(data);
    if (data)
      this.taskId = data;
    this.isSignFile = false;
  };
  @Input() set hello_sign_email_status(val) {
    this.recepEmail = val ?? ''
  };
  @Input() credentialArr;
  @Input('vendorDetail') set vendorDetail(value:any) {
    if(value) {
      this.vendor_details = value;
      this.hideResendButton();
    }
}
@Input('assignmentData') set assignmentData(value:any) {
  if(value) {
    this.assignment_data = value;
    this.hideResendButton()
  }
}
  @Output() onClose = new EventEmitter();
  @ViewChild('uploadFileInput') uploadFileInput: ElementRef;
  vendor_details:any;
  showFullText = false;
  docForm: UntypedFormGroup;
  is_completed = false;
  programID;
  taskData;
  qualificationType: any;
  fileSize: any;
  uploadedFileArr: any = [];
  formattedUploadArr: any = [];
  fileNotSupportAlert = false;
  isValidFileSize = true;
  mbKbFileSize = '';
  isImageFile = true;
  isSubmitted: boolean = false;
  isInvalidDates: boolean = false;
  invalidDateMesg = '';
  isVendor = false;
  client: any;
  isSignFile: any;
  isActor = false;
  accesstoMarkAsDone = false;
  currentProgram : any;
  recepEmail: string = '';
  logs: Log= undefined;
  hideResendEmail: boolean= false;
  assignment_data:any;
  showFullActorValue : boolean = false;
  private accountDetails = this.storageService.get('account');
  private subscrptions: Subscription[] = [];
  nonEditable = true;
  candidateDetail:any;
  options: any = {
    language: 'English',
    timepicker: true,
    format12h: true,
    range: false,
    enabledDateRanges: [{ end: new Date()}],
  };
  constructor(
    private eventStream: EventStreamService,
    private fb: UntypedFormBuilder,
    private assignmentService: AssignmentService,
    private storageService: StorageService,
    private alert: AlertService,
    private loaderService: LoaderService,
    private datePipe: LocalDateFormatPipe,
    private candidateService: CandidateService,
    private confirmService:ConfirmationDialogService,
    private authorizeService: AuthorizationService
  ) {
    this.client = new HelloSign({
      clientId: '54ebd13398302d62b7959df32cfd366e'
    });

  }

  @HostListener('dragover', ['$event']) onDragOver(evt) {
    evt.preventDefault();
    evt.stopPropagation();
  }
  @HostListener("drop", ["$event"]) ondrop(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.uploadFile(evt);
  }
  ngOnInit() {
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    //if (this.accountDetails?.organization?.category == 'SUPER_ORG') {
      this.accesstoMarkAsDone = true;
    //}
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);

    if (this.accountDetails?.organization?.category == 'VENDOR' || this.accountDetails?.organization?.category == 'SUPER_ORG') {
      this.isVendor = true;
      /* WIP-1697: Worker Onboarding : Vendor should be able to upload documents for OverDue Status and for closed assignments
       if (this.assignmentStatus?.toLowerCase() == "closed") {
        this.isVendor = false;
      } */
    }

    if (!this.programID) {
      let programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
      if (programDetails) {
        this.dateFormat = programDetails?.defaultDateFormat?.toUpperCase();
        this.programID = programDetails['id'];
        this.getTaskDetails(this.taskId);
      }
    }
    this.createForm();
    this.subscrptions.push(this.eventStream.on(Events.UPDATE_TASK_ID).subscribe((data) => {
      if (data?.taskId) {
        this.isSubmitted = false;
        this.getTaskDetails(data?.taskId);
        this.taskId = data?.taskId;
      }
    }));

    this.subscrptions.push(this.docForm.get('expiry_date').valueChanges.subscribe((data) => {
      if (data) {
        let currentDate = new Date();
        const expiry_date = this.datePipe.transform(data, DATE_FORMAT?.FORMATMDY, null, null, true, this.dateFormat);
        if (this.getFormattedDate(new Date(expiry_date)) != this.getFormattedDate(currentDate) && new Date(expiry_date) < currentDate) {
          this.invalidDateMesg = `Expiry Date cannot be before today's date`;
          // this.isInvalidDates = true;
          this.docForm.get('expiry_date').setValue(null);
        } else {
          this.invalidDateMesg = ``;
          // this.isInvalidDates = false;
        }
      }
    }));
    this.subscrptions.push(this.docForm.get('issue_date').valueChanges.subscribe((data) => {
      if (data) {
        let currentDate = new Date();
        let form = this.docForm.value;
        const issue_date = this.datePipe.transform(data, DATE_FORMAT?.FORMATMDY, null, null, true, this.dateFormat);
        const expiry_date = this.datePipe.transform(form?.expiry_date, DATE_FORMAT?.FORMATMDY, null, null, true, this.dateFormat);
        if (new Date(issue_date) > currentDate) {
          // this.isInvalidDates = true;
          this.docForm.get('issue_date').setValue(null);
          this.invalidDateMesg = 'Issue date cannot be a future date';
        } else if (expiry_date && this.getFormattedDate(new Date(issue_date)) != this.getFormattedDate(currentDate) && new Date(issue_date) > new Date(expiry_date)) {
          // this.isInvalidDates = true;
          this.docForm.get('expiry_date').setValue(null);
          this.invalidDateMesg = 'Expiry Date cannot be before Issue date.';
        } else {
          this.invalidDateMesg = ``;
          // this.isInvalidDates = false;
        }
      }
    }));

  }
  helloSign(filedata,type) {
    let programDetails = (this.storageService.get(StorageKeys.CURRENT_PROGRAM));
    let programId = programDetails['id'];
    if (this.isActor) {
      let payLoad = {
        "file_ids": [filedata?.id],
        "program_id": programId,
        "candidate_id": this.candidateID,
        "task_id": this.taskId,
        "assignment_id": this.assignmentID,
        "type": type
      }
      const url = `/hello-sign/programs/${programId}/tasks?get_embedded_url=true`;
      this.subscrptions.push(this.assignmentService.post(url, payLoad).subscribe({
        next: (data: any) => {
          data?.document_detail.forEach(dd => {
            if (dd?.file_id === filedata?.id) {
              this.client.open(dd?.embedded_url, { testMode: true });
              this.client.on('finish', (data) => {
                this.getHelloSignFiles();
                this.sidebarClose();
              });
            }
          });
        },
        error: error => {
          this.showError(error);
        }
      }));
    }
  }

  getHelloSignFiles() {
    let programDetails = (this.storageService.get(StorageKeys.CURRENT_PROGRAM));
    let programId = programDetails['id'];
    let query = `?program_id=${programId}&candidate_id=${this.candidateID}&task_id=${this.taskId}&assignment_id=${this.assignmentID}`;
    const url = `/hello-sign/programs/${programId}/tasks` + query;
    this.assignmentService.get(url).subscribe({
      next: (data: any) => {
        if (data && data?.length > 0) {
          data[0]?.document_detail?.forEach(d => {
            this.uploadedFileArr?.forEach(uf => {
              if (d?.file_id === uf?.id) {
                uf.signature_id = d?.signature_id
                uf.signed_file_url = d.signed_file_url
                uf.signed_status = d.signed_status
                this.isSignFile = true;
              }
            });
          });

          if (data && data?.length > 0) {
            data[0]?.document_detail?.forEach(d => {
              this.taskData?.source_task?.files?.forEach(uf => {
                if (d?.file_id === uf?.id) {
                  uf.signature_id = d?.signature_id
                  uf.signed_file_url = d.signed_file_url
                  uf.signed_status = d.signed_status
                  this.isSignFile = true;
                }
              });
            });
          }
        }
      },
      error: error => {
        this.showError(error);
      }
    });
  }

  downloadAttachment(data) {
    var link = document.createElement('a');
    if (data?.signed_file_url) {
      link.href = data?.signed_file_url;
    } else {
      link.href = data?.url;
    }
    link.download = data.file_name;
    link.dispatchEvent(new MouseEvent('click'));
  }

  createForm() {
    this.docForm = this.fb.group({
      credential_type: [null],
      document_number: [null],
      issue_date: [null],
      expiry_date: [null],
      note: [null],
      files: [null],
      details: [null],
      date_of_completion: [null],
      result:[null]
    })
  }

  sidebarClose() {
    this.logs = undefined;
    this.taskDetails = "hidden";
    ///this.uploadFileInput.nativeElement.value = '';
    this.onClose.emit(false);
    this.isInvalidDates = false;
    this.invalidDateMesg = ``;
    this.isValidFileSize = true;
  }

  snakeCaseToTitle(snakeCaseString) {
    if (!snakeCaseString) {
      return '';
    }
    snakeCaseString = snakeCaseString.toLowerCase().split('_');
    for (let i = 0; i < snakeCaseString.length; i++) {
      snakeCaseString[i] = snakeCaseString[i][0].toUpperCase() + snakeCaseString[i].slice(1);
    }
    return snakeCaseString.join(' ');
  }

  setValidation(value) {
    let validate = null;
    if (value) {
      validate = [Validators.required];
    }
    this.docForm.get('credential_type').setValidators(validate);
    this.docForm.get('credential_type').updateValueAndValidity();
    this.docForm.get('document_number').setValidators(validate);
    this.docForm.get('document_number').updateValueAndValidity();
    if (this.taskData?.task_type == 'BACKGROUND_CHECK') {
      this.docForm.get('date_of_completion').setValidators(validate);
      this.docForm.get('date_of_completion').updateValueAndValidity();
      this.docForm.get('result').setValidators(validate);
      this.docForm.get('result').updateValueAndValidity();
      this.docForm.get('details').setValidators(validate);
      this.docForm.get('details').updateValueAndValidity();
    }

    // this.docForm.get('issue_date').setValidators(validate);
    // this.docForm.get('issue_date').updateValueAndValidity();
    // this.docForm.get('expiry_date').setValidators(validate);
    // this.docForm.get('expiry_date').updateValueAndValidity();
    this.setFileValidator(value);
  }

  setFileValidator(condition) {
    let validate = null;
    if (condition) {
      validate = [Validators.required];
    }
    this.docForm.get('files').setValidators(validate);
    this.docForm.get('files').updateValueAndValidity();
  }

  getTaskDetails(taskID) {
    if (!this.programID) {
      let programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
      if (programDetails) {
        this.programID = programDetails['id'];
      }
    }
    this.taskData = this.taskDetailsData;
    if (this.assignmentID && this.candidateID && taskID && this.programID) {
      this.loaderService.show();
      this.subscrptions.push(this.assignmentService.getTaskDetails(this.programID, this.assignmentID, this.candidateID, taskID).subscribe({
        next: (data: any) => {
          if (data?.task) {
            this.taskData = data?.task;
            this.taskData.actor = this.taskData?.roles;
            this.getCandidateDetails(this.taskData);
            this.docForm.patchValue({
              credential_type: this.taskData?.custom_fields?.credential_type || null,
              issue_date: this.taskData?.custom_fields?.issue_date ? this.datePipe.transform(this.taskData?.custom_fields?.issue_date, this.dateFormat, null, null, true, DATE_FORMAT?.FORMATMDY) : null,
              document_number: this.taskData?.custom_fields?.document_number || null,
              expiry_date: this.taskData?.custom_fields?.expiry_date ? this.datePipe.transform(this.taskData?.custom_fields?.expiry_date, this.dateFormat, null, null, true, DATE_FORMAT?.FORMATMDY) : null,
              note: this.taskData?.notes || null,
              files: this.taskData?.files || null,
              details: this.taskData?.custom_fields?.details || null,
              date_of_completion: this.taskData?.custom_fields?.date_of_completion ? this.datePipe.transform(this.taskData?.custom_fields?.date_of_completion, this.dateFormat, null, null, true, DATE_FORMAT?.FORMATMDY) : null,
              result: this.taskData?.custom_fields?.result || null
            })
            this.formattedUploadArr = this.taskData?.files || [];
            this.updateDetails(this.taskData?.files);
            this.is_completed = this.taskData?.status === 'COMPLETED' || false;
            if (this.taskData?.task_type == 'UPLOAD_CREDENTIAL') {
              this.setValidation(true);
              this.docForm.get('credential_type').setValidators(Validators.required);
              this.docForm.get('document_number').setValidators(Validators.required);
            } else {
              this.setValidation(false);
            }
            if (this.taskData?.task_type == 'ACKNOWLEDGEMENT' || this.taskData?.task_type == 'BACKGROUND_CHECK') {
              this.setFileValidator(false);
            } else {
              this.setFileValidator(true);
            }
            if(this.taskData?.task_type == 'BACKGROUND_CHECK') {
              this.docForm.get('details').setValidators(Validators.required);
              this.docForm.get('date_of_completion').setValidators(Validators.required);
              this.docForm.get('result').setValidators(Validators.required);
            }

            if (this.canUserEditTask(this.taskData)){
              this.isActor = true;
            }else{
              this.isActor =false;
            }
            if (this.taskData?.status == 'COMPLETED') {
              this.isActor = false;
            }

            if(this.taskData?.status == "REOPENED") {
              const hasUserPermission = this.authorizeService.authorize('reopen_onboarding_task');
              if(hasUserPermission) {
                this.isActor = true;
              }
            }
            //this.getHelloSignFiles();
          }
          this.loaderService.hide();
        },
        error: () => {
          this.loaderService.hide();
        }
      }));
    }
  }

  canUserEditTask = (element: any): boolean => {
    let canUserEditTask: boolean = false;
    if (this.accountDetails?.organization?.category == UsersType.SUPER_ORG) canUserEditTask = true;
    else {
      if (element.roles?.length > 0) {
        canUserEditTask = element.roles.some(role => role.name?.toLowerCase() == this.accountDetails?.role?.name?.toLowerCase() && role?.organization_category?.toLowerCase() == this.accountDetails?.organization?.category?.toLowerCase());
      }
      else {
        canUserEditTask =
          (element?.role?.name?.toLowerCase() == this.accountDetails?.role?.name?.toLowerCase() &&
            element?.role?.organization_category?.toLowerCase() == this.accountDetails?.organization?.category?.toLowerCase()) ||
          element?.role?.name?.toLowerCase() == '';
      }
    }
    return canUserEditTask;
  }

  validationCheck() {
    const formData = this.docForm.value;
    if (!this.docForm.valid) {
      this.alert.error("Please provide all required fields ");
      return false;
    } else if (this.isInvalidDates) {
      return false;
    } else if (formData.expiry_date && new Date(formData.expiry_date) < new Date(formData.issue_date)) {
      return false;
    }
    return true;
  }

  saveTaskDetails(isMarkAsDone?) {
    this.logs = undefined;
    let formData = this.docForm.value;
    const isValid = this.validationCheck();
    if(!isValid) {
      return;
    }
    this.isSubmitted = true;
    this.loaderService.show();
    const payload = {
      is_completed: this.is_completed,
      notes: formData?.note
    }
    let files = [];
    this.formattedUploadArr?.forEach(file => {
      if (file?.raw) {
        files.push(file)
      }
    });
    if (this.taskData?.task_type == 'SIGN_DOCUMENT' || this.taskData?.task_type == 'ATTACH_DOCUMENT') {
      if (files?.length > 0)
        payload['files'] = files;
    } else if (this.taskData?.task_type == 'UPLOAD_CREDENTIAL') {
      payload['credential_type'] = formData?.credential_type;
      payload['document_number'] = formData?.document_number;
      payload['issue_date'] = this.datePipe.transform(formData?.issue_date, DATE_FORMAT?.FORMATMDY, null, null, true, this.dateFormat);
      payload['expiry_date'] = this.datePipe.transform(formData?.expiry_date, DATE_FORMAT?.FORMATMDY, null, null, true, this.dateFormat);
      if (files?.length > 0)
        payload['files'] = files;
    }else if (this.taskData?.task_type == 'BACKGROUND_CHECK') {
      payload['details'] = formData?.details;
      payload['date_of_completion'] = this.datePipe.transform(formData?.date_of_completion, DATE_FORMAT?.FORMATMDY, null, null, true, this.dateFormat);;
      payload['result'] = formData?.result;
      if (files?.length > 0)
        payload['files'] = files;
    }
    this.subscrptions.push(this.assignmentService.updateTaskDetails(this.programID, this.assignmentID, this.candidateID, this.taskId, payload).subscribe({
      next: data => {
        if (data) {
          this.alert.success('Task saved successfully.');
          this.isSubmitted = false;
          this.docForm.reset();
          this.sidebarClose();
          this.onClose.emit(true);
          this.loaderService.hide();
        }
      },
      error: (err) => {
        this.showError(err);
        this.isSubmitted = false;
        this.loaderService.hide();
        if(isMarkAsDone){
          this.is_completed = false;
        }
      }
    }));
  }

  updateDetails(files) {
    this.uploadedFileArr = [];
    files?.forEach(file => {
      let data = { ...file };
      data['name'] = file?.file_name;
      data['ext'] = file?.file_name?.split('.').pop();
      this.uploadedFileArr.push(data);
    });
  }
  uploadFile(event: any): void {
    if (event) {
      this.fileNotSupportAlert = false;
      let fileEvent = event.target?.files ? event.target.files : event.dataTransfer.files;
      let fileExtension = fileEvent[0].name.split('.').pop();
      if (fileExtension) {
        fileExtension = fileExtension.toLowerCase();
      }
      if (fileExtension == 'pdf' || fileExtension == 'doc' || fileExtension == 'docx') {
        const fsize = fileEvent[0].size;
        let fileData = fileEvent[0];
        let upload = {};
        upload['name'] = fileData.name;
        upload['time'] = Date.now();
        upload['ext'] = fileData.name.split('.').pop();
        if (fileExtension == 'png' || fileExtension == 'jpg' || fileExtension == 'jpeg') {
          this.isImageFile = true;
        } else {
          this.isImageFile = false;
        }
        // file in KB
        if (fsize < 1000000) {
          this.isValidFileSize = true;
          this.mbKbFileSize = 'KB';
          this.fileSize = Math.floor(fsize / 1000);
          upload['size'] = this.fileSize;
          //file to base64
          this.assignmentService.encodeToBase64(fileData)
            .then((data) => {
              upload['raw'] = data;
              this.uploadedFileArr.push(upload);
              this.formattedUploadArr.push({ file_name: upload['name'], raw: upload['raw'] });
              this.docForm.get('files').setValue(this.formattedUploadArr);
            }).catch((err) => {
              console.error("FileError", err)
            });
        } else {
          //file in MB
          this.mbKbFileSize = 'MB';
          this.fileSize = (fsize / (1024 * 1024)).toFixed(2);
          // if its a image file -> should be less than 3MB
          if (fileExtension == 'png' || fileExtension == 'jpg' || fileExtension == 'jpeg') {
            if (this.fileSize <= 3) {
              this.isValidFileSize = true;
              //file to base64
              this.assignmentService.encodeToBase64(fileData)
                .then((data) => {
                  upload['raw'] = data;
                  this.uploadedFileArr.push(upload);
                  this.formattedUploadArr.push({ file_name: upload['name'], raw: upload['raw'] });
                  this.docForm.get('files').setValue(this.formattedUploadArr);
                }).catch((err) => {
                  console.error("FileError", err)
                });
            } else {
              this.isValidFileSize = false;
            }
          } else {
            // if its a doc file -> should be less than 10MB
            if (this.fileSize <= 7) {
              this.isValidFileSize = true;
              //file to base64
              this.assignmentService.encodeToBase64(fileData)
                .then((data) => {
                  upload['raw'] = data;
                  this.uploadedFileArr.push(upload);
                  this.formattedUploadArr.push({ file_name: upload['name'], raw: upload['raw'] });
                  this.docForm.get('files').setValue(this.formattedUploadArr);
                }).catch((err) => {
                  console.error("FileError", err)
                });
            } else {
              this.isValidFileSize = false;
            }
          }
        }
      } else {
        this.fileNotSupportAlert = true;
      }
    }
  }
  deleteFile(index) {
    this.fileSize = '';
    this.isValidFileSize = true;
    this.uploadFileInput.nativeElement.value = '';
    this.uploadedFileArr.splice(index, 1);
    this.formattedUploadArr.splice(index, 1);
    this.docForm.get('files').setValue(this.formattedUploadArr);
  }



  deleteFileById(file, index) {
    if(file.id) {
    this.subscrptions.push(this.assignmentService.delete(`/onboarding-manager/programs/${this.programID}/assignments/${this.assignmentID}/candidates/${this.candidateID}/onboarding/tasks/${this.taskData.id}/documents/${file?.id}`, {})
      .subscribe(res => {
        this.alert.success('File deleted successfully.');
        this.getTaskDetails(this.taskId);
      }));
    } else {
      this.deleteFile(index);
    }
  }

  getFormattedDate(date) {
    if (date) {
      return this.datePipe.transform(date);
    }
  }

  ngOnDestroy(): void {
    this.subscrptions?.forEach(sub => sub.unsubscribe());
  }

  getCandidateDetails(taskStatus?) {
    this.candidateService.getCandidateDetail(this.candidateID).subscribe({
      next: (data: any) => {
        this.candidateDetail = {...data.candidate};
        this.recepEmail = !taskStatus?.hello_sign_email_status ? this.candidateDetail.email : taskStatus?.hello_sign_email_status;

      },
      error: err => {
        this.alert.error(err);
      }
    });
  }

  get disableHelloSign (){
        return true;
    //  return this.currentProgram?.config?.is_hellosign_disabled
  }

  get checkSignDoc () {
    return this.taskData?.task_type === "SIGN_DOCUMENT" && this.taskData?.status !== "COMPLETED" ? false : true;
  }

  resendEmail() {
    this.loaderService.show();
    let body: any = {};
    if(this.recepEmail && this.recepEmail !== '')
      body = {recipient_email: this.recepEmail}
    this.subscrptions.push( this.assignmentService.resendEmail(this.programID, this.candidateID, body,  this.assignmentID, this.taskId).subscribe({
      next: (data: any) => {
        this.sidebarClose();
        this.onClose.emit(true);
        this.loaderService.hide();
        this.alert.success('Hello Sign Email re-sent successfully');
      },
      error: (err) => {
        this.loaderService.hide();
        // this.alert.error(errorHandler(err));
        this.showError(err);
      }
    }))
  }
  editEmailField() {
    this.nonEditable = !this.nonEditable;
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
submitCompletedOnboarding() {
    if (!this.is_completed) {
      this.is_completed = true;
      const isValid = this.validationCheck();
      if (!isValid) {
        setTimeout(() => {
          this.is_completed = false;
        }, 100);
        return;
      }
      this.confirmService.confirm('', `Once mark as done, you will not be able to edit the saved details. Are you sure you want to proceed?`
        , 'Yes', 'No').then((confirmed) => {
          if (confirmed) {
            this.saveTaskDetails(true);
          }
          this.is_completed = confirmed;
        })
    } else {
      this.is_completed = false;
    }
  }
  hideResendButton() {
    let user_type = this.storageService.get(StorageKeys.USER_TYPE)?.toLowerCase();
    if(this.vendor_details && this.assignment_data && (this.vendor_details?.vendor_type?.toLowerCase() === VendorType.DirectSourcing )&& this.assignment_data?.assignment?.is_dsaas &&  user_type?.toLowerCase() === UserType.Vendor?.toLowerCase()) {
      this.hideResendEmail = true;
     }
  }
}
