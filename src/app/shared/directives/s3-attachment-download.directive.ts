import { Directive, HostListener, Input } from '@angular/core';
import { AwsS3FileUploadService } from '../service/utility/aws.s3.upload.service';

@Directive({
  selector: '[downloadFile]'
})
export class S3AttachmentDownloadDirective {

  @Input() downloadFile: any = null;

  @HostListener('click', ['$event.target'])
  downloadAttachment() {
    const { name, key } = this.downloadFile || {};
    if(name && key) {
      this.s3BucketService.downloadS3Attachment({ name, key });
    }
  }

  constructor(private s3BucketService: AwsS3FileUploadService) { }
}
