import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ResumeUploadService {
  constructor() {}

  encodeToBase64(filedata) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(filedata);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }
}
