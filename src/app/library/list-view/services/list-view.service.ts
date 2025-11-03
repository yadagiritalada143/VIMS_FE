import { Injectable } from '@angular/core';
import { HttpService } from 'src/app/core/services/http.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ListViewService {
  private baseURL = `${environment.API_ENDPOINT}/mdm`;

  constructor(private httpService: HttpService) {}

  getAvailableColoumConfig = (module: string, entity: string, programId: string) => {
    let url = `/custom-columns-available?namespace=${module}&entity_name=${entity}&program=${programId}`;
    return this.httpService.get(url, this.baseURL);
  };

  getSelectedColumns =(module: string, entity: string, programId: string) => {
    let url = `/custom-columns?namespace=${module}&entity_name=${entity}&program=${programId}`;
    return this.httpService.get(url, this.baseURL);
  }

  saveColumnSettings = (module: string, entity: string, programId: string, data: any) => {
    let url = `/custom-columns?namespace=${module}&entity_name=${entity}&program=${programId}`;
    return this.httpService.post(url, data, this.baseURL);
  };

  getModuleList = (module: string, entity: string, programId: string, data: any , page :number, limit :number,orderBy:string,order:string) => {
    let url = `/instances?namespace=${module}&entity_name=${entity}&program=${programId}&page=${page}&limit=${limit}&order_by=${orderBy}&order=${order}`;
    return this.httpService.post(url, data, this.baseURL);
  };

  getFilterOptions = (module: string, entity: string, programId: string, fieldName, value) => {
    let url = `/instances?namespace=${module}&entity_name=${entity}&program=${programId}&field=${fieldName}&value=${value}`;
    return this.httpService.get(url, this.baseURL);
  };
}
