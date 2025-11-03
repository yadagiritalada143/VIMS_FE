import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild, HostListener } from '@angular/core';
import { ResumeUploadService } from './resume-upload.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';

@Component({
  selector: 'app-resume-upload',
  templateUrl: './resume-upload.component.html',
  styleUrls: ['./resume-upload.component.scss']
})
export class ResumeUploadComponent implements OnInit {
  resumeFileSize: any;
  isValidFileSize = true;
  viewMode = false;
  resumeFile = {
    name: null,
    time: 0,
    ext: null,
    raw: null
  };
  fileNotSupportAlert = false;
  mbKbFileSize = '';
  toggleResumeAutoFill = {
    value: false
  };
  modalStatus = {
    value: false
  };
  progressBar = false;

  @Output() resumeData = new EventEmitter();
  @Output() isValidFile = new EventEmitter();

  @ViewChild('fileInput') fileInput: ElementRef;


  constructor(
    private _resumeUploadService: ResumeUploadService,
    private confirmService: ConfirmationDialogService
  ) { }
  @HostListener('dragover', ['$event']) onDragOver(evt) {
    evt.preventDefault();
    evt.stopPropagation();
  }
  @HostListener("drop", ["$event"]) ondrop(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.uploadResume(evt);
  }
  ngOnInit(): void {
  }

  deleteResume() {
    if (this.resumeFileSize) {
      this.confirmService.confirm('', `Are you sure you want to delete the resume?`,
        'Yes', 'No')
        .then((confirmed) => {
          if (confirmed) {
            this.clearExistingResume();
            // this.resumeFileSize = '';
            // this.isValidFileSize = true;
            // //this.fileInput.nativeElement.value = '';
            // this.resumeFile = {
            //   name: null,
            //   time: 0,
            //   ext: null,
            //   raw: null
            // };
            // this.resumeData.emit(null)
          }
        }).catch(() => {

        });
    }
  }
   clearExistingResume() {
    this.resumeFileSize = '';
    this.isValidFileSize = true;
    this.resumeFile = {
      name: null,
      time: 0,
      ext: null,
      raw: null
    };
    this.resumeData.emit(null);
    this.isValidFile.emit(true);
   }

  onClickToggleAutofill() {
    // this.toggleResumeAutoFill.value = !this.toggleResumeAutoFill.value;
    if (this.toggleResumeAutoFill.value === true) {
      this.toggleResumeAutoFill.value = false;
    } else {
      this.modalStatus.value = !this.modalStatus.value;
    }
  }
  onFileDropped(files: Array<any>) {
    this.uploadResume({
      target: {
        files: files
      }
    });
  }

  uploadResume(event: any, flag?): void {

    if (event) {
      this.progressBar = true;
      this.fileNotSupportAlert = false;
      const fileEvent = event.target?.files ? event.target.files : event.dataTransfer.files;
      const fileExtension = fileEvent[0].name.split('.').pop();
      const fileData = fileEvent[0];
      this.resumeFile['name'] = fileData.name;
      this.resumeFile['time'] = Date.now();
      this.resumeFile['ext'] = fileData.name.split('.').pop();
      if (fileExtension === 'pdf' || fileExtension === 'doc' || fileExtension === 'docx') {
        const fsize = fileEvent[0].size;
        // check file in KB
        if (fsize < 1000000) {
          this.isValidFileSize = true;
          this.mbKbFileSize = 'KB';
          this.resumeFileSize = Math.floor(fsize / 1000);
          // file to base64
          this._resumeUploadService.encodeToBase64(fileData)
            .then((data) => {
              this.resumeFile['raw_without_base64'] = String(data).split(',')[1];
              this.resumeFile['raw'] = data;
              // this.onClickToggleAutofill();
              this.resumeData.emit(this.resumeFile);
              this.isValidFile.emit(true);
            }).catch((err) => {
              console.error('FileError', err)
            });
        } else {
          // check file in MB
          this.mbKbFileSize = 'MB';
          this.resumeFileSize = (fsize / (1024 * 1024)).toFixed(2);
          if (this.resumeFileSize <= 10) {
            this.isValidFileSize = true;
            // file to base64
            this._resumeUploadService.encodeToBase64(fileData)
              .then((data) => {
                
                this.resumeFile['raw_without_base64'] = String(data).split(',')[1];
                this.resumeFile['raw'] = data;
                // this.onClickToggleAutofill();
                this.resumeData.emit(this.resumeFile);
                this.isValidFile.emit(true);
              }).catch((err) => {
                console.error('FileError', err)
              });
          } else {
            this.isValidFileSize = false;
            this.isValidFile.emit(false);
          }
        }
      } else {
        this.fileNotSupportAlert = true;
      }
    }
    this.progressBar = false;
  }

}
