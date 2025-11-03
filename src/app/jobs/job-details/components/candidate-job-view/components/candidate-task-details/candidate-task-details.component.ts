import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ElementRef, HostListener, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { JobDetailsService } from 'src/app/jobs/job-details/job-details.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { JobService } from 'src/app/jobs/job.service';
import HelloSign from "hellosign-embedded";
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { UsersType } from 'src/app/shared/enums';
import { CandidateService } from 'src/app/candidates/service/candidate.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { Subscription } from 'rxjs';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';

@Component({
  selector: 'app-candidate-task-details',
  templateUrl: './candidate-task-details.component.html',
  styleUrls: ['./candidate-task-details.component.scss']
})
export class CandidateTaskDetailsComponent implements OnInit, OnDestroy {

  taskId: string = undefined;
  @Input() taskDetails = "hidden";

  @Input() jobID;
  @Input() candidateID;

  @Input() set taskID(data) {
    this.getTaskDetails(data);
    if (data)
      this.taskId = data;
  };

  @Input() credentialArr;
  @Output() onClose = new EventEmitter();
  @ViewChild('uploadFileInput') uploadFileInput: ElementRef;
  recepEmail: string = '';
  emailvalidation = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
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
  isActor = false;
  accesstoMarkAsDone = false;
  client: any;
  isSignFile: any;
  currentProgram : any;
  options: any = {
    language: 'English',
    timepicker: true,
    format12h: true,
    range: false,
    enabledDateRanges: [{ end: new Date()}],
  };
  private accountDetails = this.storageService.get('account');
  nonEditable = true;
  candidateDetail:any;
  prefferedfDateFormat:any;
  private subscriptions: Subscription[] = [];
  constructor(
    private eventStream: EventStreamService,
    private fb: UntypedFormBuilder,
    private jobDetailsService: JobDetailsService,
    private storageService: StorageService,
    private alert: AlertService,
    private loaderService: LoaderService,
    private jobService: JobService,
    private datePipe: LocalDateFormatPipe,
    private candidateService: CandidateService,
    private confirmService: ConfirmationDialogService,
    private authorizeService: AuthorizationService,
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
    if (this.accountDetails?.organization?.category == UsersType.SUPER_ORG) {
      this.accesstoMarkAsDone = true;
    }
    this.prefferedfDateFormat = this.currentProgram?.defaultDateFormat?.toUpperCase();
    this.createForm();
    this.subscriptions.push(
    this.eventStream.on(Events.CANDIDATE_UPDATE_TASK_ID).subscribe((data) => {
      if (data?.taskId) {
        this.isSubmitted = false;
        this.getTaskDetails(data?.taskId);
        this.taskId = data?.taskId;
      }
    }));
    this.docForm.get('expiry_date').valueChanges.subscribe((data) => {
      if (data) {
        let currentDate = new Date();
        const expiry_date = this.datePipe.transform(data, DATE_FORMAT?.FORMATMDY, null, null, true, this.prefferedfDateFormat);
        if (this.getFormattedDate(new Date(expiry_date)) != this.getFormattedDate(currentDate) && new Date(expiry_date) < currentDate) {
          this.invalidDateMesg = `Expiry Date cannot be before today's date`;
          // this.isInvalidDates = true;
          this.docForm.get('expiry_date').setValue(null);
        } else {
          this.invalidDateMesg = ``;
          // this.isInvalidDates = false;
        }
      }
    });
    this.docForm.get('issue_date').valueChanges.subscribe((data) => {
      if (data) {
        let currentDate = new Date();
        let form = this.docForm.value;
        const issue_date = this.datePipe.transform(data, DATE_FORMAT?.FORMATMDY, null, null, true, this.prefferedfDateFormat);
        const expiry_date = this.datePipe.transform(form?.expiry_date, DATE_FORMAT?.FORMATMDY, null, null, true, this.prefferedfDateFormat);
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
    });

  }
  helloSign(filedata, type) {
    if (this.isActor) {
      let payLoad = {
        "file_ids": [filedata?.id],
        "program_id": this.programID,
        "candidate_id": this.candidateID,
        "task_id": this.taskId,
        "job_id": this.jobID,
        "type": type
      }
      const url = `/hello-sign/programs/${this.programID}/tasks?get_embedded_url=true`;
      this.jobService.post(url, payLoad).subscribe({
        next: (data: any) => {
        data?.documents.forEach(dd => {
          if (dd?.file_id === filedata?.id) {
            this.client.open(dd?.embedded_url, { testMode: true });
            this.client.on('finish', (data) => {
              this.getHelloSignFiles();
              this.sidebarClose();
            });
          }
        });

      },
      error: (error) => {
        this.alert.error(errorHandler(error), {});
      }});
    }
  }

  getHelloSignFiles() {

    let query = `?program_id=${this.programID}&candidate_id=${this.candidateID}&task_id=${this.taskId}&job_id=${this.jobID}`;
    const url = `/hello-sign/programs/${this.programID}/tasks` + query;


    this.jobService.get(url).subscribe({
      next: (data: any) => {
      if (data && data?.length > 0) {
        data[0]?.documents?.forEach(d => {
          this.uploadedFileArr?.forEach(uf => {
            if (d?.file_id === uf?.id) {
              uf.signature_id = d?.signature_id
              uf.signed_file_url = d.signed_file_url
              uf.signed_status = d.signed_status
              this.isSignFile = true;
            }
          });
        });

        data[0]?.documents?.forEach(d => {
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
    },
    error: error => {
      this.alert.error(errorHandler(error), {});
    }});
  }

  downloadAttachment(data) {
    if (this.isActor || this.taskData?.status == 'COMPLETED') {
      var link = document.createElement('a');
      if (data?.signed_file_url) {
        link.href = data?.signed_file_url;
      } else {
        link.href = data?.url;
      }
      link.download = data.file_name;
      link.dispatchEvent(new MouseEvent('click'));
    }
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
    this.taskDetails = "hidden";
    //   this.uploadFileInput.nativeElement.value = '';
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
    if (this.jobID && this.candidateID && taskID && this.programID) {
      this.loaderService.show();
      this.jobDetailsService.getTaskDetails(this.programID, this.jobID, this.candidateID, taskID).subscribe({
        next: (data: any) => {
        if (data?.task) {
          this.taskData = data?.task;
          this.taskData.actor = this.getActorName(this.taskData);
          this.getCandidateDetails(this.taskData);
          this.docForm.patchValue({
            credential_type: this.taskData?.custom_fields?.credential_type || null,
            issue_date: this.taskData?.custom_fields?.issue_date ? this.datePipe.transform(this.taskData?.custom_fields?.issue_date, this.prefferedfDateFormat, null, null, true, DATE_FORMAT?.FORMATMDY) : null,
            document_number: this.taskData?.custom_fields?.document_number || null,
            expiry_date: this.taskData?.custom_fields?.expiry_date ? this.datePipe.transform(this.taskData?.custom_fields?.expiry_date, this.prefferedfDateFormat, null, null, true, DATE_FORMAT?.FORMATMDY) : null,
            note: this.taskData?.notes || null,
            files: this.taskData?.files || null,
            details: this.taskData?.custom_fields?.details || null,
            date_of_completion: this.taskData?.custom_fields?.date_of_completion ? this.datePipe.transform(this.taskData?.custom_fields?.date_of_completion, this.prefferedfDateFormat, null, null, true, DATE_FORMAT?.FORMATMDY) : null,
            result: this.taskData?.custom_fields?.result || null
          })
          this.formattedUploadArr = this.taskData?.files || [];
          this.updateDetails(this.taskData?.files);
          this.is_completed = this.taskData?.status === 'COMPLETED' || false;
          if (this.taskData?.task_type == 'UPLOAD_CREDENTIAL') {
            this.docForm.get('credential_type').setValidators(Validators.required);
            this.docForm.get('document_number').setValidators(Validators.required);
            this.setValidation(true);
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

          if (this.canUserEditTask(this.taskData)) {
            this.isActor = true;
          } else {
            this.isActor = false;
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
      error: (err) => {
        this.loaderService.hide();
        // this.alert.error(errorHandler(err));
      }});
    }
  }

  getActorName = (element: any) => {
    let actorName: string;
    if (element.roles?.length > 0) {
      const names = element.roles.map((role) => {
        return (role?.organization_category ? role?.organization_category +'-' : '') + role?.name;
      });
      if (names?.length > 0) actorName = names.join(', ');
    } else {
      actorName =  (element?.role?.organization_category ? element?.role?.organization_category +'-' : '') + element?.role?.name;
    }
    return actorName;
  };

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
    const formData = this.docForm.value;
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
      payload['issue_date'] = this.datePipe.transform(formData?.issue_date, DATE_FORMAT?.FORMATMDY, null, null, true, this.prefferedfDateFormat);
      payload['expiry_date'] = this.datePipe.transform(formData?.expiry_date, DATE_FORMAT?.FORMATMDY, null, null, true, this.prefferedfDateFormat);
      if (files?.length > 0)
        payload['files'] = files;
    } else if (this.taskData?.task_type == 'BACKGROUND_CHECK') {
      payload['details'] = formData?.details;
      payload['date_of_completion'] = this.datePipe.transform(formData?.date_of_completion, DATE_FORMAT?.FORMATMDY, null, null, true, this.prefferedfDateFormat);
      payload['result'] = formData?.result;
      if (files?.length > 0)
        payload['files'] = files;
      }
    this.jobDetailsService.updateTaskDetails(this.programID, this.jobID, this.candidateID, this.taskId, payload).subscribe({
      next: (data: any) => {
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
      this.alert.error(errorHandler(err));
      this.isSubmitted = false;
      this.loaderService.hide();
      if(isMarkAsDone){
        this.is_completed = false;
      }
    }});
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
          this.jobDetailsService.encodeToBase64(fileData)
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
              this.jobDetailsService.encodeToBase64(fileData)
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
              this.jobDetailsService.encodeToBase64(fileData)
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

  getFormattedDate(date) {
    if (date) {
      return this.datePipe.transform(date);
    }
  }

  deleteFileById(file, index) {
    if(file.id) {
    this.subscriptions.push(this.jobService.delete(`/onboarding-manager/programs/${this.programID}/jobs/${this.jobID}/candidates/${this.candidateID}/onboarding/tasks/${this.taskData.id}/documents/${file?.id}`, {})
      .subscribe(res => {
        this.alert.success('File deleted successfully.');
        this.getTaskDetails(this.taskId);
      }));
    } else {
      this.deleteFile(index);
    }
  }

  getCandidateDetails(taskStatus?) {
    this.candidateService.getCandidateDetail(this.candidateID).subscribe({
      next: (data: any) => {
      this.candidateDetail = {...data.candidate};
      this.recepEmail = !taskStatus?.hello_sign_email_status ? this.candidateDetail.email : taskStatus?.hello_sign_email_status;
    },
    error: (err) => {
      this.alert.error(err);
     }});
  }

  get disableHelloSign (){
    return true;
    //return this.currentProgram?.config?.is_hellosign_disabled
  }

  get checkSignDoc () {
    return this.taskData?.task_type === "SIGN_DOCUMENT" && this.taskData?.status !== "COMPLETED" ? false : true;
  }

  resendEmail() {
    this.loaderService.show();
    let body: any = {};
    if(this.recepEmail && this.recepEmail !== '')
      body.recipient_email = this.recepEmail;
    this.jobService.resendEmail(this.programID, this.candidateID, body,  this.jobID, this.taskId)
    .subscribe({
     next: (data: any) => {
      this.sidebarClose();
      this.onClose.emit(true);
      this.loaderService.hide();
      this.alert.success('Hello Sign Email re-sent successfully');
    },
    error: (err) => {
      this.loaderService.hide();
      this.alert.error(errorHandler(err));
    }})
  }
  editEmailField() {
    this.nonEditable = !this.nonEditable;
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
  ngOnDestroy(): void {
    this.subscriptions?.forEach((sub) => sub.unsubscribe());
  }
}
