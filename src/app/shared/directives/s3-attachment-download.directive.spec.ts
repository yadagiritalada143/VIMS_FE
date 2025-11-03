import { S3AttachmentDownloadDirective } from './s3-attachment-download.directive';
import { AwsS3FileUploadService } from '../service/utility/aws.s3.upload.service';

describe('S3AttachmentDownloadDirective', () => {
  it('should create an instance', () => {
    const s3BucketServiceMock = {} as AwsS3FileUploadService;
    const directive = new S3AttachmentDownloadDirective(s3BucketServiceMock);
    expect(directive).toBeTruthy();
  });
});
