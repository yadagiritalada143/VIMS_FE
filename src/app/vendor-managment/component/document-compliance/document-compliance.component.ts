import { HttpEventType } from '@angular/common/http';
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { map, mergeMap } from 'rxjs/operators';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { UserType } from 'src/app/expense/enums/expense.enums';
import { ProgramService } from 'src/app/programs/program.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { AwsS3FileUploadService } from 'src/app/shared/service/utility/aws.s3.upload.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { Subscription } from 'rxjs';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';

@Component({
  selector: 'app-document-compliance',
  templateUrl: './document-compliance.component.html',
  styleUrls: ['./document-compliance.component.scss']
})
export class DocumentComplianceComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  @ViewChild('fileUpload') fileUpload: ElementRef;
  @Input() visiblity = 'hidden';
  @Input() programId;
  @Input() vendorId;
  @Output() onClose = new EventEmitter();
  @Output() onSubmit = new EventEmitter<any>();
  complianceList: any[] = [];
  contactForm = this.fb.group({});
  currentDoc: any;
  userType: any;
  update = false;
  docExpirationDate: any = '';
  notes: any = '';
  status;
  fileName: any;
  fileType: any;
  base64File: any;
  readyToUploadDoc: any;
  uploadedId: any;
  options: any = {
    language: 'English'
  };
  dateFormat : any = '';
  programDetail : any = {}
  isNotesMandatory: boolean = false;
  fileExtension:string;
  constructor(private alert: AlertService,
    private programService: ProgramService,
    private loader: LoaderService,
    private storageService: StorageService,
    private fb: UntypedFormBuilder,
    private eventStream: EventStreamService,
    private s3UploadService: AwsS3FileUploadService,
    private datePipe: LocalDateFormatPipe,
    private confirmService: ConfirmationDialogService,
    private cd: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.userType = this.storageService.get('user_type');
    this.programDetail = this.storageService.get(StorageKeys.CURRENT_PROGRAM)
    this.dateFormat = this.programDetail.defaultDateFormat.toUpperCase()
    this.options = {
      language: 'English',
      enabledDateRanges: [
        { start: new Date() },
      ]
    };

    this.subscriptions.push(this.eventStream.on(Events.SHOW_COMPLIANCE).subscribe((data: any) => {
      if (data) {
        this.visiblity = 'visible';
        this.currentDoc = data;
        this.fileExtension = this.currentDoc?.uploaded_document?.file_name?.split('.')?.pop();
        if(typeof this.currentDoc.allowed_to_edit == "undefined"){
          this.currentDoc.allowed_to_edit = true;
        }
        const account = this.storageService.get(StorageKeys?.CURRENT_ACCOUNT);
        if((account?.role?.organization_category)?.toUpperCase() === UserType.Client ||
        (account?.role?.organization_category)?.toUpperCase() === UserType.Super_org||
        (account?.role?.organization_category)?.toUpperCase() === UserType.MSP){
          this.currentDoc.allowed_to_edit = true;
        }
        if (this.currentDoc.status !== 'PENDING') {
          this.status = this.currentDoc.status;
          this.notes = this.currentDoc?.uploaded_document?.compliance_note ? this.currentDoc?.uploaded_document?.compliance_note : '';
          this.docExpirationDate = null;
        } else {
          this.status = '';
          this.notes = '';
          this.docExpirationDate = null;
        }
      }
      this.cd.detectChanges()
    }));
  }

  docSelected(event) {
    if (event) {
      this.currentDoc = event;
      this.update = true;
    }

  }

  deleteUpload() {
    this.confirmService.confirm('', `Are you sure you want to delete?`,
      'Yes', 'No')
      .then((confirmed) => {
        if (confirmed) {
          if (this.readyToUploadDoc) {
            this.readyToUploadDoc = null;
          } else {
            this.loader.show();
            this.subscriptions.push(
              this.programService.delete(`/configurator/programs/${this.programId}/vendors/${this.vendorId}/compliance-documents/${this.currentDoc?.uploaded_document?.id}`)
                .subscribe({
                  next: (res: any) => {
                    this.alert.success('Successfully Deleted');
                    this.docExpirationDate = '';
                    this.notes = '';
                    this.update = false;
                    this.currentDoc.uploaded_document = null;
                    this.loader.hide();
                  }, error: (err: Error | any) => this.loader.hide()
                }
              )
            );
          }
        }
      }
    );
  }


  loadDoc(id = '') {
    if (!id) {
      return;
    }
    const url = `/configurator/programs/${this.programId}/vendors/${this.vendorId}/compliance-documents/${id}`;
    this.subscriptions.push(this.programService.get(url).subscribe((res: any) => {
      const { compliace_document } = res;
      this.currentDoc.uploaded_document = compliace_document;
      this.status = compliace_document.status;
      this.notes = compliace_document?.compliance_note ? compliace_document.compliance_note : '';
      if (this.currentDoc?.uploaded_document?.complied_by && this.currentDoc?.uploaded_document?.complied_by?.last_name) {
        this.currentDoc.uploaded_document.complied_by.first_name +=  ` ${this.currentDoc.uploaded_document.complied_by.last_name}`
      }
    }));
  }
  download() {
    const link = document.createElement("a");
    let source: any;
    if (!this.base64File) {
      link.download = this.currentDoc?.uploaded_document?.file_name;
      source = this.currentDoc?.uploaded_document?.url;
    } else {
      link.download = this.fileName
      source = this.base64File;
    }

    link.href = source;
    link.download = this.fileName
    link.click();
  }
  sideBaClose() {
    this.visiblity = 'hidden';
    this.update = false;
    this.readyToUploadDoc = null;
    this.notes = '';
    this.docExpirationDate = '';
    this.onClose.emit();
  }

  updateClicked() {
    this.update = true;
  }

  contactSubmit() {
    this.onSubmit.emit();
    this.contactForm.reset();
  }

  openFile(fileUpload){
    if(fileUpload){
      fileUpload.value = '';
      fileUpload?.click();
      }
  }

  handleUpload(event) {
    const file = event.target.files[0];
    if (!file) {
      this.fileUpload.nativeElement.value = '';
      return;
    }
    if (file.size > 10485760) {
      this.alert.warn('Please use file with 10 MB or less in size');
      this.fileUpload.nativeElement.value = '';
    }
    this.fileType = file.type;
    this.fileName = file.name;
    this.fileExtension = this.fileName?.split('.')?.pop();
    this.readyToUploadDoc = file;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      this.base64File = reader.result;
    }
  }

  uploadDoc(payload) {

    this.loader.show();
    if (this.readyToUploadDoc) {

      this.subscriptions.push(
        this.uploadTos3().subscribe({
          next: (uploadRes: any) => {

            if (uploadRes.type === HttpEventType.Response) {
              if (!this.docExpirationDate && !this.notes) {
                this.afterUpload(this.uploadedId);
                return;
              }
              this.subscriptions.push(
                this.programService.put(`/configurator/programs/${this.programId}/vendors/${this.vendorId}/compliance-documents/${this.uploadedId}`, payload)
                  .subscribe({
                    next: (res: any) => this.afterUpload(this.uploadedId),
                    error: (err: Error | any) => {
                      this.loader.hide();
                      this.alert.error(errorHandler(err));
                    }
                  }
                )
              );
            }

          }, error: (err: Error | any) => {
            this.loader.hide();
            this.alert.error(errorHandler(err));
          }
        })
      );
    } else {
      if (!this.docExpirationDate && !this.notes) {
        this.afterUpload(this.currentDoc?.uploaded_document?.id);
        return;
      }
      this.subscriptions.push(
        this.programService.put(`/configurator/programs/${this.programId}/vendors/${this.vendorId}/compliance-documents/${this.currentDoc?.uploaded_document?.id}`, payload)
          .subscribe({
            next: (res: any) => this.afterUpload(this.currentDoc?.uploaded_document?.id),
            error: (err: Error | any) => {
              this.loader.hide();
              this.alert.error(errorHandler(err));
            }
          }
        )
      );
    }
  }

  uploadTos3() {
    return this.programService.put(`/configurator/programs/${this.programId}/vendors/${this.vendorId}/compliance-documents/uploads`, {
      file_name: this.readyToUploadDoc.name,
      required_document_id: this.currentDoc?.id,
      "mime_type": this.readyToUploadDoc.type
    })
      .pipe(
        map((res: any) => {
          this.uploadedId = res.id;
          return res
        }),
        mergeMap(res1 => this.uploadDocToS3(res1?.file_uploader)));
  }

  uploadDocToS3(fileDetails) {
    let formData = new FormData();
    const fields = fileDetails?.fields || {};
    if (Object.keys(fields).length > 0) {
      Object.keys(fields).forEach(function (key) {
        formData.append(key, fields[key]);
      });
    }
    formData.append('file', this.readyToUploadDoc);
    return this.s3UploadService.uploadfileToS3Bucket(fileDetails?.url, formData);
  }

  afterUpload(id = '') {
    if(this.readyToUploadDoc){
      this.alert.success('Successfully Uploaded');
    }
    this.readyToUploadDoc = null;
    this.docExpirationDate = '';
    this.notes = '';
    this.loader.hide();
    this.update = false;
    this.loadDoc(id);
  }
  valueChanged(event) {
    if (event && event?.length > 0) {
      this.isNotesMandatory = false;
    } else {
      this.isNotesMandatory = true;
    }
  }

  get isPdf() {
    if (this.readyToUploadDoc && this.readyToUploadDoc.name) {
      return this.readyToUploadDoc.name?.search('.pdf') > -1
    }
    return this.currentDoc?.uploaded_document?.file_name?.search('.pdf') > -1
  }

  save() {
    const payload = {};
    if (this.docExpirationDate) {
      payload['expiry_on'] = this.datePipe.transform(this.docExpirationDate, DATE_FORMAT.FORMATMDY ,null ,null , true, this.dateFormat);
    }
    if (this.userType !== 'VENDOR') {
      if (this.notes) {
        payload['notes'] = this.notes;
      } else {
        this.isNotesMandatory = true;
        return;
      }
      payload['status'] = this.status;
    }
    this.uploadDoc(payload);
  }

  onFileDropped(files: Array<any>) {
    this.handleUpload({
      target: {
        files: files
      }
    });
  }
  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
