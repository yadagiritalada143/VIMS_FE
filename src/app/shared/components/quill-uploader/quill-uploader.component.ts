import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild, HostListener, Input } from '@angular/core';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { ResumeUploadService } from 'src/app/shared/components/svms-tab-components/resume-upload/resume-upload.service';
import { JobService } from 'src/app/jobs/job.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { map, mergeMap } from 'rxjs';
import { HttpEventType } from '@angular/common/http';
import { AwsS3FileUploadService } from '../../service/utility/aws.s3.upload.service';
import { DocumentParsingService } from '../../service/utility/document-parsing.service';
@Component({
  selector: 'app-quill-uploader',
  templateUrl: './quill-uploader.component.html',
  styleUrls: ['./quill-uploader.component.scss']
})
export class QuillUploaderComponent implements OnInit {
  fileSize: any;
  fileDetails = {
    name: null,
    time: 0,
    ext: null,
    raw: null,
  };
  // isValidFileSize = true;
  mbKbFileSize = '';
  programId: String;
  quillForm: UntypedFormGroup;
  extsArray = [];
  s3FileKey;
  readyToUploadDoc;
  showLoader: boolean = false;
  showDocumentPreview = "hidden";
  fileUrl;
  @ViewChild('fileInput', { static: false }) fileInput: ElementRef;
  @Input() isParsingDone = false;
  @Input() uploadFileData;
  @Input() exts;
  @Input() modules = {};
  @Input() isParsingReq: boolean = true;
  @Input() refName;
  @Input() readOnly = false;//for whole component
  @Input() isUploadBtn = true; //for upload button
  @Input() isQuillEditorRead: boolean;//for quill editor
  @Input() isUploadBtnReq: boolean = false;
  @Input() set quillInputTxt(quillInput) {
    if (!this.quillForm) {
      this.quillForm = this.fb.group({
        quillInput: [null]
      })
    }
    if (this.quillForm) {
      this.quillForm.patchValue({ quillInput });
    }
  }
  @Output() quillInputEmitter = new EventEmitter<any>();
  @Output() fileData = new EventEmitter();
  @Output() errorLog = new EventEmitter();
  @Output() dataBeforeParse = new EventEmitter();
  constructor(
    private _resumeUploadService: ResumeUploadService,
    private confirmService: ConfirmationDialogService,
    private jobService: JobService,
    private storageService: StorageService,
    private loaderService: LoaderService,
    private fb: UntypedFormBuilder,
    private alert: AlertService,
    private s3UploadService: AwsS3FileUploadService,
    private parseDocumentService: DocumentParsingService
  ) { }

  @HostListener('dragover', ['$event']) onDragOver(evt) {
    evt.preventDefault();
    evt.stopPropagation();
  }

  @HostListener('drop', ['$event']) ondrop(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.uploadFile(evt);
  }

  ngOnInit(): void {
    if (this.exts) {
      this.exts.split(', .').forEach(ext => {
        this.extsArray.push(ext.startsWith('.') ? ext.substring(1) : ext);
      });
    }
    this.programId = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.id;
    if (!this.quillForm) {
      this.quillForm = this.fb.group({
        quillInput: [null]
      })
    }
    this.quillForm.controls.quillInput.valueChanges.subscribe((res) => {
      this.quillInputEmitter.emit(res);
    })
  }

  ngOnChanges() {
    if (this.uploadFileData?.name) {
      this.fileDetails = {
        name: this.uploadFileData?.name,
        time: this.uploadFileData?.time,
        ext: this.uploadFileData?.name.split('.').pop(),
        raw: null,
      };
      this.readyToUploadDoc = this.uploadFileData;
      this.getPreviewUrl();
      this.uploadFileData.size = Number(this.uploadFileData?.size);
      if (this.uploadFileData?.size < 1000000) {
        this.mbKbFileSize = 'KB';
        this.fileSize = Math.floor(this.uploadFileData?.size / 1000);
      } else {
        this.mbKbFileSize = 'MB';
        this.fileSize = (this.uploadFileData?.size / (1024 * 1024)).toFixed(2);
      }
    }
  }

  deleteFile() {
    this.confirmService
      .confirm('', `Are you sure you want to delete the file?`, 'Yes', 'No')
      .then(confirmed => {
        if (confirmed) {
          if (!this.isParsingDone) {
            this.dataBeforeParse.emit(this.quillForm.get('quillInput')?.value);
          }
          this.emptyFile(true);
        }
      })
      .catch(() => { });
  }

  onFileDropped(files: Array<any>) {
    this.uploadFile({
      target: {
        files: files,
      },
    });
  }

  uploadFile(event: any): void {
    if (event && (event?.target?.files?.length || event?.dataTransfer?.files?.length)) {
      const fileEvent = event?.target?.files ? event?.target?.files : event?.dataTransfer?.files;
      const fileExtension = fileEvent[0].name.split('.').pop();
      const fileDetails = fileEvent[0];
      const fileData = fileDetails;
      this.readyToUploadDoc = fileEvent[0];
      this.fileDetails['name'] = fileDetails.name;
      this.fileDetails['time'] = new Date().getTime();
      this.fileDetails['ext'] = fileDetails.name.split('.').pop();
      this.fileDetails['size'] = fileEvent[0].size;
      if (this.extsArray.includes(fileExtension)) {
        const fsize = fileEvent[0].size;
        // check file in KB
        if (fsize < 1000000) {
          // this.isValidFileSize = true;
          this.mbKbFileSize = 'KB';
          this.fileSize = Math.floor(fsize / 1000);
          // file to base64
          this._resumeUploadService
            .encodeToBase64(fileDetails)
            .then(data => {
              this.fileDetails['raw_without_base64'] = String(data).split(',')[1];
              this.fileDetails['raw'] = data;
              if (this.isParsingReq) {
                this.autoFillData(fileData)
              }
              this.uploadS3(this.fileDetails);
            })
            .catch(err => {
              console.error('FileError', err);
            });
        } else {
          // check file in MB
          this.mbKbFileSize = 'MB';
          this.fileSize = (fsize / (1024 * 1024)).toFixed(2);
          if (this.fileSize <= 5) {
            // this.isValidFileSize = true;
            // file to base64
            this._resumeUploadService
              .encodeToBase64(fileDetails)
              .then(data => {
                this.fileDetails['raw_without_base64'] = String(data).split(',')[1];
                this.fileDetails['raw'] = data;
                this.isParsingReq && this.autoFillData(fileData);
                this.uploadS3(this.fileDetails);
              })
              .catch(err => {
                console.error('FileError', err);
              });
          } else {
            // this.isValidFileSize = false;
            this.emptyFile();
            this.alert.error("File size must be less than 5 MB");
          }
        }
      } else {
        this.emptyFile();
        this.alert.error(`File type is not supported. Please upload the file either in ${this.exts?.replaceAll(',', ' /')?.toUpperCase()} format.`)
      }
    }
  }

  autoFillData(data) {
    if (data) {
      this.loaderService.show();
      this.parseDocumentService.parseDocument(data, `/text_extract`).subscribe({
        next: (data: any) => {
          this.showLoader && this.loaderService.hide();
          this.showLoader = true;
          if (data) {
            this.quillInputEmitter.emit({ data, isParsed: true });
            this.isParsingDone = true;
          }
        },
        error: (err) => {
          if (err?.status == 200) {
            this.showLoader && this.loaderService.hide();
            this.showLoader = true;
            this.dataBeforeParse.emit(this.quillForm.get('quillInput')?.value);
            if(this.fileDetails.ext == 'txt') {
              err.error.text = err?.error?.text?.replaceAll("<pre>","<p class='prewrap'>").replaceAll("</pre>","</p>");
            }
            this.quillInputEmitter.emit({ data: err?.error?.text, isParsed: true });
            this.isParsingDone = true;
          } else if (err?.status == 500) {
            err = {
              error: {
                error: {
                  message: err.error.message
                }
              }
            }
            this.errorLog.emit(err);
            this.loaderService.hide();
          } else {
            this.errorLog.emit(err);
            this.loaderService.hide();
          }
          this.showLoader = true;
        }
      })
    }
  }


  afterUpload(success: boolean = false) {
    if (success) {
      this.alert.success('Successfully Uploaded');
    }
  }

  uploadS3(fileData) {
    this.loaderService.show();
    if (this.programId && this.refName && this.readyToUploadDoc) {
      this.createConnectionToS3FileServer().subscribe({
        next: (uploadRes: any) => {
          if (uploadRes.type === HttpEventType.Response) {
            this.readyToUploadDoc = { name: fileData['name'], key: fileData['key'], ext: fileData['ext'], time: fileData['time'], size: fileData['size'] },
            this.readyToUploadDoc['key'] = this.s3FileKey;
            this.getPreviewUrl();
            this.fileData.next(this.readyToUploadDoc);
            if (!this.isParsingReq) {
              this.showLoader = true;
            }
            this.showLoader && this.loaderService.hide();
            this.showLoader = true;
            this.afterUpload();
          }
        },
        error: () => {
          if (!this.isParsingReq) {
            this.showLoader = true;
          }
          this.showLoader && this.loaderService.hide();
          this.showLoader = true;
        }
      });
    }
  }

  createConnectionToS3FileServer() {
    if (this.programId && this.refName && this.readyToUploadDoc) {
      return this.jobService
        .post(`/configurator/file-uploader`, {
          params: {
            organization_id: null,
            program_id: this.programId,
            entity_ref: this.refName,
            file_name: this.readyToUploadDoc.name,
          },
        })
        .pipe(
          map((res: any) => {
            return res;
          }),
          mergeMap((response: any) => this.uploadDocToS3(response.file.url)),
        );
    }
  }

  uploadDocToS3(fileDetails) {
    let formData = new FormData();
    const fields = fileDetails?.fields || {};
    if (fields) {
      if (Object.keys(fields).length > 0) {
        Object.keys(fields).forEach(function (key) {
          formData.append(key, fields[key]);
        });
      }
      this.s3FileKey = fileDetails.fields['key'];
      formData.append('file', this.readyToUploadDoc);
      return this.s3UploadService.uploadfileToS3Bucket(fileDetails?.url, formData);
    }
  }

  downloadAttachment(file) {
    if (file && file?.name && file?.key) {
      this.s3UploadService.downloadS3Attachment(file);
    }
  }

  previewSidebarClose() {
    this.showDocumentPreview = "hidden";
  }

  showPreview() {
    this.showDocumentPreview = "visible";
  }

  emptyFile(isRemoveData?: boolean) {
    this.fileSize = '';
    // this.isValidFileSize = true;
    this.fileDetails = {
      name: null,
      time: 0,
      ext: null,
      raw: null,
    };
    this.readyToUploadDoc = null;
    this.fileUrl = "";
    if(isRemoveData){
      this.fileData.emit(null);
    }
    else{
      this.fileData.emit({
        isShowData: true,
      })
    }
    this.fileInput.nativeElement.value = '';//added for same file addition after deletion
  }

  getPreviewUrl() {
    if (this.readyToUploadDoc && this.readyToUploadDoc?.key && this.readyToUploadDoc?.name && !this.fileUrl) {
      this.s3UploadService.getFileUrl(this.readyToUploadDoc).subscribe({
        next: (res: any) => {
          this.fileUrl = res?.file?.url;
        }
      });
    }
  }
}

