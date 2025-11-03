import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HttpService } from 'src/app/core/services/http.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';

@Injectable({
  providedIn: 'root',
})
export class GlobalLaunchService {
  constructor(private _http: HttpService,private storageService:StorageService) {}

  loadGlobalLaunchConfiguration = async () => {
   await this.getGlobalLaunchConfiguration().toPromise()
  };

  getGlobalLaunchConfiguration = (): Observable<any> => {
   return this._http.get('/configurator/global-launch?limit=50').pipe(map((data: any) =>  {
      this.storageService.set(StorageKeys.GLOBAL_LAUNCH_CONFIG,data?.global_launch_data,true);
    }));
  };

  get GlobalLaunchList() {
    return this.storageService.get(StorageKeys.GLOBAL_LAUNCH_CONFIG);
  }

  updateGlobalLaunchConfiguration = async() => {
   await this.getGlobalLaunchConfiguration().toPromise();
  };

  isglobalLaunchSlugFlagEnabled = (slugname: string) => {
    if (slugname && this.GlobalLaunchList?.length > 0) {
      const slugExist = this.GlobalLaunchList.find(config => config.slug === slugname);
      if (slugExist) {
        return this.GlobalLaunchList.find(config => config.slug === slugname)?.is_enabled;
      } else {
        return true;
      }
    }
  };

  isglobalLaunchSlugConfig = (slugname: string) => {
    if (slugname && this.GlobalLaunchList?.length > 0) {
      return this.GlobalLaunchList.find(config => config.slug === slugname);
    }
  };
}

export class GlobalLaunchConfig {
  descriptions: string;
  id: string;
  name: string;
  is_enabled: boolean;
  slug: string;
}

export enum GlobalLaunchKeys {
  MASTER_TALENT_PROFILE_MODULE = 'master_talent_module_enablement',
  CREDENTIALING_MODULE = "credentialing_enablement",
  JOB_LIST = 'job_list_view_\'try_new_view\'',
  INTEVRVIEW_LIST = 'interview_list_view_\'try_new_view\'',
  CANDIDATE_LIST = 'candidate_list_view_\'try_new_view\'',
  OFFER_LIST = 'offer_list_view_\'try_new_view\'',
  SUBMISSION_LIST = 'submission_list_view_\'try_new_view\'',
  ASSIGNMENT_LIST = 'assignment_list_view_\'try_new_view\''
}
