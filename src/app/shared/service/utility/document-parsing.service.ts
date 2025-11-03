import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root'
})
export class DocumentParsingService {
  API_ENDPOINT: string = undefined;
  constructor(private http:HttpClient) { 
    this.API_ENDPOINT = environment.PARSING_URL;
  }

  parseDocument(data,endpoint) {
    const file = data;
    const formData = new FormData();
    formData.append('data',file);
    return this.http.post(this.API_ENDPOINT+endpoint,formData);
  }
}
