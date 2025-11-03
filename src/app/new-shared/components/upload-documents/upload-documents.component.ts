import { Component, OnInit, Input, HostListener, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CandidateService } from '../../../candidates/service/candidate.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';

@Component({
  selector: 'app-upload-documents',
  templateUrl: './upload-documents.component.html',
  styleUrls: ['./upload-documents.component.scss']
})
export class UploadDocumentsComponent implements OnInit {
  @Input() uploadLabel;
  @Input() set fileUrl(data) {
    this._fileUrl = data;
  };
  @Input() set multiple(data) {
    this._multiple = data;
  };
  _multiple = true;
  _fileUrl: any;
  @Output() uploadDataFiles: EventEmitter<any> = new EventEmitter<any>();
  @Output() oldUploadDataFiles: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('uploadFileInput') uploadFileInput: ElementRef;
  @Input() private closePanel: EventEmitter<boolean>;
  uploadedFileArr = [];
  formattedUploadArr = [];
  _showLabel = true;
  @Input() oldUploadfileArr;
  @Input() set newUploadfileArr(data) {
    this.uploadedFileArr = data;
  };
  @Input() set isVendorAndSuperOrg(data) {
    this._isVendorAndSuperOrg = data;
  };
  _isVendorAndSuperOrg: false;
  // @Input() showLabel= true;
  @Input() set showLabel(data) {
    this._showLabel = data;
  };
  fileSize: any;
  showDeleteButton: boolean = true;
  @Input() supportedFileTypes = ['pdf','doc','docx','png','jpg','jpeg','csv','xlsx','xls'];
  @Input() errorMessage = "Error : File type is not supported. Please upload the documents either in .png, .jpg, .pdf, .doc ,.csv, .xls, .txt format";
  @Input() allowedMessage = "Only .png, .jpg, .pdf, .doc, .csv, .xls, .txt files with maximum size of 5 MB";
  @Input() set showDeleteOption(showDelete: boolean) {
    this.showDeleteButton = showDelete;
  }
  fileNotSupportAlert = false;
  isValidFileSize = true;
  mbKbFileSize = '';
  isImageFile = true;
  @Input() sizeErrorText: string = null;
  @Input() isFiveMbFileValid = false; 
  @Input() fileSizeAllowed: number = null;
  @Output() isValidFile = new EventEmitter();
  constructor(private candidateService: CandidateService,
    private confirmService: ConfirmationDialogService, public alert: AlertService
  ) { }
  @HostListener('dragover', ['$event']) onDragOver(evt) {
    evt.preventDefault();
    evt.stopPropagation();
  }
  @HostListener("drop", ["$event"]) ondrop(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.uploadFile(evt);
  }
  ngOnInit(): void {
    if (this.closePanel) {
      this.closePanel.subscribe(data => {
        this.fileNotSupportAlert = false;
        this.fileSize = '';
        this.isValidFileSize = true;
        this.isValidFile.emit(true);
        this.uploadFileInput.nativeElement.value = '';
        this.uploadedFileArr = [];
      });
    }
  }
  downloadAttachment(data) {
    var link = document.createElement('a');
    if (data) {
      link.href = data;
    } else {
      this.alert.error('File Not Found.', {});
    }
    link.dispatchEvent(new MouseEvent('click'));
  }
  uploadFile(event: any): void {
    if (event) {
      this.fileNotSupportAlert = false;
      let fileEvent = event.target?.files ? event.target.files : event.dataTransfer.files;
      let fileExtension = fileEvent[0]?.name.split('.').pop();
      if(this.supportedFileTypes.indexOf(fileExtension?.toLowerCase()) >= 0){
        const fsize = fileEvent[0].size;
        let fileData = fileEvent[0];
        let upload = {};
        upload['name'] = fileData.name;
        upload['time'] = (fileData.time) ? fileData.time : new Date().getTime();
        upload['ext'] = fileData.name.split('.').pop();
        if (fileExtension == 'png' || fileExtension == 'jpg' || fileExtension == 'jpeg') {
          this.isImageFile = true;
        } else {
          this.isImageFile = false;
        }
        // file in KB
        if (this.isFiveMbFileValid && fsize > 5242880) {
          this.isValidFileSize = false;
          this.isValidFile.emit(false);
          return;
        }

        if (fsize < 1000000 ) {
          this.isValidFileSize = true;
          this.isValidFile.emit(true);
          this.mbKbFileSize = 'KB';
          this.fileSize = Math.floor(fsize / 1000);
          upload['size'] = this.fileSize;
          //file to base64
          this.candidateService.encodeToBase64(fileData)
            .then((data) => {
              upload['raw'] = data;
              if (this._multiple) {
                this.uploadedFileArr.push(upload);
              } else {
                this.uploadedFileArr = [upload];
              }
              if (!this._multiple && this.formattedUploadArr?.length > 0) {
                this.formattedUploadArr?.splice(0, this.formattedUploadArr?.length);
              }
              this.formattedUploadArr.push({ name: upload['name'], raw: upload['raw'], ext: fileExtension, time: upload['time'], size: this.fileSize });
              this.uploadDataFiles.emit(this.formattedUploadArr);
            }).catch((err) => {
            });
        } else {
          //file in MB
          this.mbKbFileSize = 'MB';
          this.fileSize = (fsize / (1024 * 1024)).toFixed(2);
          upload['size'] = this.fileSize;
          // if its a image file -> should be less than 3MB
          if (fileExtension == 'png' || fileExtension == 'jpg' || fileExtension == 'jpeg') {
            if (this.fileSize <= (this.fileSizeAllowed || 3)) {
              this.isValidFileSize = true;
              this.isValidFile.emit(true);
              //file to base64
              this.candidateService.encodeToBase64(fileData)
                .then((data) => {
                  upload['raw'] = data;
                  if (this._multiple) {
                    this.uploadedFileArr.push(upload);
                  } else {
                    this.uploadedFileArr = [upload];
                  } this.formattedUploadArr.push({ name: upload['name'], raw: upload['raw'], ext: fileExtension, time: upload['time'], size: this.fileSize });
                  this.uploadDataFiles.emit(this.formattedUploadArr);
                }).catch((err) => {
                });
            } else {
              this.isValidFileSize = false;
              this.isValidFile.emit(false);
            }
          } else {
            // if its a doc file -> should be less than 10MB
            if (this.fileSize <= (this.fileSizeAllowed || 10)) {
              this.isValidFileSize = true;
              this.isValidFile.emit(true);
              //file to base64
              this.candidateService.encodeToBase64(fileData)
                .then((data) => {
                  upload['raw'] = data;
                  if (this._multiple) {
                    this.uploadedFileArr.push(upload);
                  } else {
                    this.uploadedFileArr = [upload];
                  } this.formattedUploadArr.push({ name: upload['name'], raw: upload['raw'], ext: fileExtension, time: upload['time'], size: this.fileSize });
                  this.uploadDataFiles.emit(this.formattedUploadArr);
                }).catch((err) => {
                });
            } else {
              this.isValidFileSize = false;
              this.isValidFile.emit(false);
            }
          }
        }
      } else {
        this.fileNotSupportAlert = true;
      }
    }
  }
  deleteFile(index) {
    this.confirmService.confirm('', `Are you sure you want to delete the file?`,
      'Yes', 'No')
      .then((confirmed) => {
        if (confirmed) {
          this.fileSize = '';
          this.isValidFileSize = true;
          this.isValidFile.emit(true);
          this.uploadFileInput.nativeElement.value = '';
          this.uploadedFileArr.splice(index, 1);
          this.formattedUploadArr.splice(index, 1);
          this.uploadDataFiles.emit(this.formattedUploadArr);
        }
      }).catch(() => {

      });
  }
  deleteOldFile(index) {

    this.confirmService.confirm('', `Are you sure you want to delete the file?`,
      'Yes', 'No')
      .then((confirmed) => {
        if (confirmed) {
          this.oldUploadfileArr.splice(index, 1);
          this.oldUploadDataFiles.emit(this.oldUploadfileArr);
        }
      }).catch(() => {

      })
  }
}
