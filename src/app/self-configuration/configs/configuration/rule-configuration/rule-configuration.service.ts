import { Injectable } from '@angular/core';
import { HttpService } from '../../../../../app/core/services/http.service';
import { StorageKeys, StorageService } from '../../../../core/services/storage.service';
@Injectable({
  providedIn: 'root'
})
export class RuleConfigurationService {
  constructor(
    public storageService: StorageService,
    public _http: HttpService
  ) { }


  get(url) {
    return this._http.get(url);
  }
  post(url, payload) {
    return this._http.post(url, payload);
  }

  put(url, payload) {
    return this._http.put(url, payload);
  }
  delete(url, payload) {
    return this._http.delete(url, payload);
  }

  getDefaultRuleConfig(){
    return {
      "title": null,
      "basic_config_id": null,
      "hierarchy_ids": [],
      "location": [],
      "status": true,
      "is_active": true,
      "rules_config": [
          {
              "name": null,
              "slug": 'all',
              "rules": [
                  {
                      "conditions": [
                          {
                              "type": '',
                              "value": null,
                              "operator": "",
                              "sequence": null,
                              "logical_operator": ""
                          }
                      ],
                      "periodicity": null,
                      "rate_factor": null                
                    }
              ],
              "apply_on": 'overtime'       
            }]
        }
      }
  impactedTimesheetList(payload: any, configId: string) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let url = `/timesheet/programs/${currentProgram?.id}/config/rule/${configId}/timesheet/impacted?per_page=10`;
    return this.post(url, payload);
  }
  
  onRuleConfigToggleStatusChanges(payload: any, configId: string) {
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let url = `/timesheet/programs/${currentProgram?.id}/config/rule/${configId}/status`;
    return this.put(url, payload);
  }
  
  getAssignmentRuleConfig(payload:any,configId: string){
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let url = `/timesheet/programs/${currentProgram?.id}/config/rule/${configId}/assignment/impacted`;
    return this.post(url,payload);
  }


  getTimesheetRuleConfig(payload:any,configId:string){
    const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    let url = `/timesheet/programs/${currentProgram?.id}/config/rule/${configId}/timesheet/impacted`;
    return this.post(url,payload);
  }


}
