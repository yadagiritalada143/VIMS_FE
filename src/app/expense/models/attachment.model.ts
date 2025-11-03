export interface AttachmentModel {
  path: string;
  thumbnail: string;
  attachment_extention: string;
  attachment_name: string;

}

export interface FileUploadedModel {
  name: string;
  time: number;
  ext: string;
  sizeParams: FileParamsModel;
  fileSupported: boolean;
}

export interface FileParamsModel {
  isValidFileSize: boolean;
  mbKbFileSize: string;
  fileSize: number;
}

export interface FileInputEventModel {
  target?: {
    files: FileList;
  };
  dataTransfer?: {
    files: FileList;
  };
}