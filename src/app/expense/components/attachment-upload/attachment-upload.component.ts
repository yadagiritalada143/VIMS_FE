import { Component, OnInit, ElementRef, EventEmitter, Output, ViewChild, HostListener, Input } from '@angular/core';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { FileInputEventModel, FileParamsModel, FileUploadedModel } from '../../models/attachment.model';

@Component({
  selector: 'app-attachment-upload',
  templateUrl: './attachment-upload.component.html',
  styleUrls: ['./attachment-upload.component.scss']
})
export class AttachmentUploadComponent implements OnInit {
  @Input() isAttachmentMandatory: boolean;

  @Output() fileData = new EventEmitter<{ file: File }[]>();
  @Output() fileRemoved = new EventEmitter();

  @ViewChild('fileInput') fileInput: ElementRef;

  public displayedUploadedFiles: FileUploadedModel[] = [];
  public uploadedFiles: { file: File }[] = [];

  constructor(private confirmationService: ConfirmationDialogService) { }

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
  }

  public deleteFile(fileName: string): void {
    this.confirmationService.confirm('', 'Are you sure you want to delete the attachment?', 'Delete', 'Cancel').then(confirmed => {
      if (confirmed) {
        this.displayedUploadedFiles = this.displayedUploadedFiles.filter(({ name }) => name !== fileName);
        this.fileRemoved.emit(fileName);
      }
    })
  }

  public onFileDropped(files: FileList): void {
    this.uploadFile({
      target: {
        files
      }
    });
  }

  public uploadFile(event: FileInputEventModel): void {
    if (event) {
      const fileEvent = event.target?.files ? event.target.files : event.dataTransfer.files;
      [...fileEvent as any].forEach((file: File) => {
        const fileExtension = file.name.split('.').pop();
        this.displayedUploadedFiles.push({
          name: file.name,
          time: Date.now(),
          ext: fileExtension,
          sizeParams: this.getFileSizeParams(file.size),
          fileSupported: fileExtension === 'pdf' || fileExtension === 'doc' || fileExtension === 'docx'
            || fileExtension === 'png' || fileExtension === 'jpg' || fileExtension === 'PDF' || fileExtension === 'DOC'
            || fileExtension === 'DOCX' || fileExtension === 'PNG' || fileExtension === 'JPG'
        });
        this.uploadedFiles.push({
          file: file
        });
        this.fileData.emit(this.uploadedFiles);
      });
    }
  }

  private getFileSizeParams(fileSize: number): FileParamsModel {
    let sizeParams: FileParamsModel = {
      isValidFileSize: true,
      mbKbFileSize: '',
      fileSize: 0
    };
    // check file in KB
    if (fileSize < 1000000) {
      sizeParams = {
        isValidFileSize: true,
        mbKbFileSize: 'KB',
        fileSize: Math.floor(fileSize / 1000)
      };
    } else {
      // check file in MB
      const uploadedFileSize = (fileSize / (1024 * 1024)).toFixed(2);
      sizeParams = {
        isValidFileSize: Number(uploadedFileSize) <= 10,
        mbKbFileSize: 'MB',
        fileSize: +uploadedFileSize
      };
    }
    return sizeParams;
  }
}
