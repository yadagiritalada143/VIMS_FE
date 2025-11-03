import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { HttpService } from 'src/app/core/services/http.service';

@Injectable({
  providedIn: 'root',
})
export class CustomFieldsService {
  constructor(private httpService: HttpService) {}

  public getSupportedFields() {
    return this.httpService.get('/configurator/resources/custom-fields');
  }

  public getAllModules(restrict: boolean = false) {
    let url: string = '/configurator/resources/module-groups';
    if(restrict) {
      url += `?module_customfield=true`;
    }

    return this.httpService.get(url);
  }

  public getProgramModules(programId: string, restrict: boolean = false) {
    let url: string = `/configurator/programs/${programId}/module-groups`;
    if(restrict) {
      url += `?module_customfield=true`;
    }

    return this.httpService.get(url);
  }

  public getRoles(programId: string) {
    return this.httpService.get(`/expense/programs/${programId}/user-roles`);
  }

  public getConfiguratorUserRoles(programId: string) {
    return this.httpService.get(`/configurator/programs/${programId}/user-roles?limit=250`);
  }

  public getVendors(programId: string,searchText?: string) {
    if(searchText){
      return this.httpService.get(`/configurator/programs/${programId}/vendors?limit=20&k=${searchText}&active=true&page=1`);
    } else {
      return this.httpService.get(`/configurator/programs/${programId}/vendors?limit=20&active=true&page=1`);
    }
  }

  public getCustomFieldDetails(programId: string, fieldId: string, entityRef: string) {
    return this.httpService.get(`/configurator/programs/${programId}/custom-fields/${fieldId}`, '', { entity_ref: entityRef });
  }

  public createCustomField(programId: string, payload) {
    return this.httpService.post(`/configurator/programs/${programId}/custom-fields`, payload);
  }

  public updateCustomField(programId: string, fieldId: string, payload) {
    return this.httpService.put(`/configurator/programs/${programId}/custom-fields/${fieldId}`, payload);
  }

  public getCurrencyData(programId: string) {
    return this.httpService.get(`/configurator/programs/${programId}/currencies`).pipe(map((res:any) => res.currencies));
  }

  public getPicklistItems(programId: string, picklistId: string) {
    return this.httpService.get(`/configurator/programs/${programId}/picklists/${picklistId}/items`).pipe(map((res:any) => res.picklist_items));
  }
  public getHierarchyList(programId: string) {
    return this.httpService.get(`/configurator/programs/${programId}/hierarchy`).pipe(map((res:any) => res));
  }
}
