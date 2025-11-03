import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild, HostListener, Input } from '@angular/core';
import { ResumeUploadService } from './resume-upload.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';

@Component({
  selector: 'svms-resume-uploader',
  templateUrl: './resume-upload.component.html',
  styleUrls: ['./resume-upload.component.scss'],
})
export class svmsResumeUploadComponent implements OnInit {
  resumeFileSize: any;
  isValidFileSize = true;
  viewMode = false;
  resumeFile = {
    name: null,
    time: 0,
    ext: null,
    raw: null,
  };
  fileNotSupportAlert = false;
  mbKbFileSize = '';
  toggleResumeAutoFill = {
    value: false,
  };
  modalStatus = {
    value: false,
  };
  progressBar = false;

  @Output() resumeData = new EventEmitter();
  @Input() candidateResumeData;
  @Input() exts;
  @Input() deleteMessage:string;
  @Input() isDeleteDisabled:boolean = false;
  extsArray = [];
  @ViewChild('fileInput') fileInput: ElementRef;

  constructor(private _resumeUploadService: ResumeUploadService, private confirmService: ConfirmationDialogService) {}

  @HostListener('dragover', ['$event']) onDragOver(evt) {
    evt.preventDefault();
    evt.stopPropagation();
  }

  @HostListener('drop', ['$event']) ondrop(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.uploadResume(evt);
  }

  ngOnInit(): void {
    if (this.exts) {
      this.exts.split(', .').forEach(ext => {
        this.extsArray.push(ext.startsWith('.') ? ext.substring(1) : ext);
      });
    }
  }

  ngOnChanges(changes) {
    if (this.candidateResumeData?.name) {
      this.resumeFile = {
        name: this.candidateResumeData?.name,
        time: this.candidateResumeData?.time,
        ext: this.candidateResumeData?.name.split('.').pop(),
        raw: null,
      };
      if(this.candidateResumeData?.size){
        if (this.candidateResumeData?.size < 1024) {
          this.mbKbFileSize = 'KB';
          this.resumeFileSize = this.candidateResumeData?.size.toFixed(2);
        } else {
          this.mbKbFileSize = 'MB';
          this.resumeFileSize = (this.candidateResumeData?.size / 1024).toFixed(2);
        }
      }
    }
  }

  deleteResume() {
   let confirmationMessage =  this.deleteMessage ?? 'Are you sure you want to delete the resume?';
    this.confirmService
      .confirm('', confirmationMessage, 'Yes', 'No')
      .then(confirmed => {
        if (confirmed) {
          this.resumeFileSize = '';
          this.isValidFileSize = true;
          //this.fileInput.nativeElement.value = '';
          this.resumeFile = {
            name: null,
            time: 0,
            ext: null,
            raw: null,
          };
          this.resumeData.emit(null);
        }
      })
      .catch(() => {});
  }

  onClickToggleAutofill() {
    if (this.toggleResumeAutoFill.value === true) {
      this.toggleResumeAutoFill.value = false;
    } else {
      this.modalStatus.value = !this.modalStatus.value;
    }
  }

  onFileDropped(files: Array<any>) {
    this.uploadResume({
      target: {
        files: files,
      },
    });
  }

  getFileImageSRC(fileExt) {
    switch(fileExt) {
      case 'pdf': return '/assets/images/pdf.svg';
      case 'doc': return '/assets/images/word.svg';
      case 'docx': return '/assets/images/word.svg';
      case 'xls': return '/assets/images/file-types/xls.svg';
      case 'xlsx': return '/assets/images/file-types/xls.svg';
      case 'zip': return '/assets/images/file-types/zip.svg';
      case 'rar': return '/assets/images/file-types/rar.svg';
      case 'txt': return '/assets/images/file-types/txt.svg';
    }
  }

  uploadResume(event: any, flag?): void {
    if (event) {
      this.progressBar = true;
      this.fileNotSupportAlert = false;
      const fileEvent = event.target?.files ? event.target.files : event.dataTransfer.files;
      const fileExtension = fileEvent[0].name.split('.').pop();
      const fileData = fileEvent[0];
      this.resumeFile['name'] = fileData.name;
      this.resumeFile['time'] = fileData.resume_upload_date;
      this.resumeFile['ext'] = fileData.name.split('.').pop();
      if (this.extsArray.includes(fileExtension)) {
        const fsize = fileEvent[0].size;
        // check file in KB
        if (fsize < 1000000) {
          this.isValidFileSize = true;
          this.mbKbFileSize = 'KB';
          this.resumeFileSize = Math.floor(fsize / 1000);
          // file to base64
          this._resumeUploadService
            .encodeToBase64(fileData)
            .then(data => {
              this.resumeFile['raw_without_base64'] = String(data).split(',')[1];
              this.resumeFile['raw'] = data;
              // this.onClickToggleAutofill();
              this.resumeData.emit(this.resumeFile);
            })
            .catch(err => {
              console.error('FileError', err);
            });
        } else {
          // check file in MB
          this.mbKbFileSize = 'MB';
          this.resumeFileSize = (fsize / (1024 * 1024)).toFixed(2);
          if (this.resumeFileSize <= 10) {
            this.isValidFileSize = true;
            // file to base64
            this._resumeUploadService
              .encodeToBase64(fileData)
              .then(data => {
                this.resumeFile['raw_without_base64'] = String(data).split(',')[1];
                this.resumeFile['raw'] = data;
                // this.onClickToggleAutofill();
                this.resumeData.emit(this.resumeFile);
              })
              .catch(err => {
                console.error('FileError', err);
              });
          } else {
            this.isValidFileSize = false;
            this.resumeFile['file_size'] = this.isValidFileSize;
            this.resumeData.emit(this.resumeFile);
          }
        }
      } else {
        this.fileNotSupportAlert = true;
      }
    }
    this.progressBar = false;
  }
}
