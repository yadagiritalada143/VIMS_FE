import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpRequest } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { HttpService } from 'src/app/core/services/http.service';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
    providedIn: 'root'
  })
export class AwsS3FileUploadService {
  constructor(private http: HttpClient, private httpService: HttpService) { }

  /* getpresignedurls(): Observable<any>{
    return this.httpService.get(`/cms/en/lang_translation/get-language-data?language=${lang}`).pipe(map(
      data => {
        return data;
      }
    ));
  } */

  uploadfileToS3Bucket(fileuploadurl, formData): Observable<any>{ 
    //this will be used to upload all csv files to AWS S3
    return this.httpService.uploadPostBlob(fileuploadurl, formData).pipe(map(
      data => {
        return data;
      }
    ));
  }

  uploadfileAWSS3(fileuploadurl, contenttype, file): Observable<any>{ 
    //this will be used to upload all csv files to AWS S3
     const headers = new HttpHeaders({"Content-Type": contenttype});
     const req = new HttpRequest(
     "PUT",
     fileuploadurl,
     file,
     {
       headers: headers,
       reportProgress: true, //This is required for track upload process
     });
     return this.http.request(req);
    }

    downloadS3Attachment(file:any) {
      if(file && file.name && file.key){
        this.httpService.post(`/configurator/file-uploader?is_download=true`, 
        {
          key: file.key,
          file_name: file.name
        }).subscribe((data: any) =>{
          var link = document.createElement('a');
          link.href = data.file.url;
          link.click();
        });
      }
    }

    getFileUrl(file:any) {
      if(file && file.name && file.key){
        return this.httpService.post(`/configurator/file-uploader?is_download=true`, 
        {
          key: file.key,
          file_name: file.name
        });
      }
    }
}