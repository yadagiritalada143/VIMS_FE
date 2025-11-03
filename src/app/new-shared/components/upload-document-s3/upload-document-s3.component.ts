import { ProgramService } from 'src/app/programs/program.service';
import { Component, OnInit, Input, HostListener, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { HttpEventType } from '@angular/common/http';
import { map, mergeMap } from 'rxjs/operators';
import { AwsS3FileUploadService } from 'src/app/shared/service/utility/aws.s3.upload.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { errorHandler } from 'src/app/shared/util/error-handler';

@Component({
  selector: 'app-upload-document-s3',
  templateUrl: './upload-document-s3.component.html',
  styleUrls: ['./upload-document-s3.component.scss'],
})
export class UploadDocumentS3Component implements OnInit {
  @Input() uploadLabel;
  @Input() isDisable?: boolean = false;
  @Input() refName;
  @Input() set oldUploadedFiles(data) {
    this.uploadedFileArr = data ?? [];
  }
  @Input() formatAllowed: Array<string> = ['pdf', 'doc', 'docx', 'jpeg', 'jpg', 'png'];
  @Input() maxFileSize: number = 25;
  // @Input() showLabel= true;
  @Input() set showLabel(data) {
    this._showLabel = data;
  }
  @Input() set multiple(data) {
    this._multiple = data;
  }
  @Input() private closePanel: EventEmitter<boolean>;

  // Output Parameters
  @Output() uploadDataFiles: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('uploadFileInput') uploadFileInput: ElementRef;

  // component variables
  uploadedFileArr = [];
  formattedUploadArr = [];
  _showLabel = true;
  _multiple = true;
  fileSize: any;
  readyToUploadDoc: any;
  fileNotSupportAlert = false;
  isValidFileSize = true;
  isImageFile = true;
  programId: string;
  s3FileKey: string;
  acceptFileTypes: string = '';

  /**
   * Constructor
   * @param confirmService
   * @param alert
   * @param s3UploadService
   * @param programService
   * @param storageService
   * @param loader
   */
  constructor(
    private confirmService: ConfirmationDialogService,
    public alert: AlertService,
    private s3UploadService: AwsS3FileUploadService,
    private programService: ProgramService,
    private storageService: StorageService,
    private loader: LoaderService,
  ) {}

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
    this.formatAllowed?.forEach(format => {
      this.acceptFileTypes += '.' + format + ', ';
    });
    if (this.closePanel) {
      this.closePanel.subscribe(data => {
        this.fileNotSupportAlert = false;
        this.fileSize = '';
        this.s3FileKey = null;
        this.readyToUploadDoc = null;
        this.isValidFileSize = true;
        this.uploadFileInput.nativeElement.value = '';
        this.uploadedFileArr = [];
        this.s3FileKey = null;
      });
    }
    const programDetails = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = programDetails['id'];
  }

  downloadAttachment(file: any) {
    if (file && file.name && file.key) {
      this.s3UploadService.downloadS3Attachment(file);
    }
  }

  uploadFile(event: any): void {
    if (event && (event?.target?.files?.length || event?.dataTransfer?.files?.length)) {
      this.loader.show();
      this.fileNotSupportAlert = false;
      this.isValidFileSize = true;
      let fileEvent = event?.target?.files ? event?.target?.files : event?.dataTransfer?.files;
      let fileExtension = fileEvent[0].name.split('.').pop();
      if (this.isValidFileFormat(fileExtension)) {
        this.readyToUploadDoc = fileEvent[0];
        const fsize = fileEvent[0].size;
        this.fileSize = +(fsize / (1024 * 1024)).toFixed(2); // MB SIze
        this.isImageFileFormat(fileExtension);
        if (this.fileSize <= this.maxFileSize) {
          let upload = {};
          upload['name'] = this.readyToUploadDoc.name;
          upload['time'] = this.readyToUploadDoc.time ? this.readyToUploadDoc.time : new Date().getTime();
          upload['ext'] = this.readyToUploadDoc.name.split('.').pop();
          upload['size'] = this.fileSize;
          if (this.programId && this.refName && this.readyToUploadDoc) {
            this.createConnectionToS3FileServer().subscribe(
              uploadRes => {
                if (uploadRes.type === HttpEventType.Response) {
                  upload['key'] = this.s3FileKey;
                  if (this._multiple) {
                    this.uploadedFileArr.push(upload);
                    this.formattedUploadArr.push({
                      name: upload['name'],
                      key: upload['key'],
                      ext: fileExtension,
                      time: upload['time'],
                      size: this.fileSize,
                    });
                  } else {
                    this.uploadedFileArr = [upload];
                    this.formattedUploadArr = [
                      { name: upload['name'], key: upload['key'], ext: fileExtension, time: upload['time'], size: this.fileSize },
                    ];
                  }
                  this.uploadDataFiles.emit(this.formattedUploadArr);
                  this.afterUpload(true);
                }
              },
              err => {
                this.afterUpload();
                this.alert.error(errorHandler(err));
              },
            );
          } else {
            this.afterUpload();
            this.alert.error('Upload Failed.Please check all mandatory details.');
          }
        } else {
          this.isValidFileSize = false;
          this.afterUpload();
        }
      } else {
        this.fileNotSupportAlert = true;
        this.afterUpload();
      }
    }
  }

  isImageFileFormat = (fileExtension: string) => {
    if (fileExtension == 'png' || fileExtension == 'jpg' || fileExtension == 'jpeg') {
      this.isImageFile = true;
    } else {
      this.isImageFile = false;
    }
  };

  isValidFileFormat = (fileExtension: string) => {
    return this.formatAllowed.indexOf(fileExtension) >= 0;
  };

  createConnectionToS3FileServer() {
    if (this.programId && this.refName && this.readyToUploadDoc) {
      return this.programService
        .post(`/configurator/file-uploader`, {
          params: {
            organization_id: null,
            program_id: this.programId,
            entity_ref: this.refName,
            file_name: this.readyToUploadDoc.name,
          },
        })
        .pipe(
          map(res => {
            return res;
          }),
          mergeMap((response: any) => this.uploadDocToS3(response.file.url)),
        );
    }
  }

  afterUpload(sucess: boolean = false) {
    this.readyToUploadDoc = null;
    this.loader.hide();
    if (sucess) {
      this.alert.success('Successfully Uploaded');
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

  deleteFile(index) {
    if(this.isDisable) {
      return false;
    }
    this.confirmService
      .confirm('', `Are you sure you want to delete the file?`, 'Yes', 'No')
      .then(confirmed => {
        if (confirmed) {
          this.fileSize = '';
          this.isValidFileSize = true;
          this.readyToUploadDoc = null;
          this.s3FileKey = null;
          this.uploadFileInput.nativeElement.value = '';
          this.uploadedFileArr.splice(index, 1);
          this.formattedUploadArr.splice(index, 1);
          this.uploadDataFiles.emit(this.formattedUploadArr);
        }
      })
      .catch(() => {});
  }

  getFileImageSRC(fileExt) {
    switch (fileExt) {
      case 'pdf':
        return '/assets/images/pdf.svg';
      case 'doc':
        return '/assets/images/word.svg';
      case 'docx':
        return '/assets/images/word.svg';
      case 'xls':
        return '/assets/images/file-types/xls.svg';
      case 'xlsx':
        return '/assets/images/file-types/xls.svg';
      case 'zip':
        return '/assets/images/file-types/zip.svg';
      case 'rar':
        return '/assets/images/file-types/rar.svg';
      case 'txt':
        return '/assets/images/file-types/txt.svg';
      case 'jpg':
        return '/assets/images/img-jpg.svg';
      case 'jpeg':
        return '/assets/images/img-jpg.svg';
      case 'png':
        return '/assets/images/img-png.svg';
    }
  }
}
