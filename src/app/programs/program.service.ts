import { Injectable, EventEmitter, Injector } from '@angular/core';
import { AlertService } from '../core/components/alert/alert.service';
import { EmitEvent, Events, EventStreamService } from '../core/services/event-stream.service';
import { HttpService } from '../core/services/http.service';
import { StorageKeys, StorageService } from '../core/services/storage.service';
import { SvmsRouterService } from '../core/services/svms-router.service';
import { DATE_FORMAT } from '../library/date-format/date-format.model';
import { ConfirmationDialogService } from '../shared/components/confirmation-dialog/confirmation-dialog.service';
import { errorHandler } from '../shared/util/error-handler';
import { BehaviorSubject, map } from 'rxjs';
import { GlobalLaunchService } from '../control-panel/configs/global-launches/global-launch.service';

@Injectable({
  providedIn: 'root'
})
export class ProgramService {
  mockApi: string;
  public shareProgramData = new EventEmitter;
  public setEnableNotificationDetails = new BehaviorSubject(null);
  enableNotificationDetails = this.setEnableNotificationDetails.asObservable();

  constructor(
    private injector: Injector,
    private storageService: StorageService,
    private _http: HttpService,
    private streamService: EventStreamService,
    private confirmService: ConfirmationDialogService,
    private router: SvmsRouterService,
    private globalLaunchService:GlobalLaunchService,
    public alertService: AlertService,

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
  delete(url) {
    return this._http.delete(url, {});
  }

  getMock(url) {
    return this._http.getMock(url);
  }
  serachClient(url) {
    let finalApi = url;
    return this._http.get(finalApi);
  }

  public setProgram(program, storeInLocalStorage, fromLogin = false, impersonate_call?: boolean) {
    if (program?.id) {
      this.getProgramModuleConfig(program?.id)
      .subscribe((resp: any) => {
        this.globalLaunchService.loadGlobalLaunchConfiguration();
        if (resp?.result?.[0].hierarchies?.[0]?.preferred_currency) {
          program['defaultCurrency'] = resp?.result?.[0].hierarchies?.[0]?.preferred_currency;
          program['defaultDateFormat'] = resp?.result?.[0].hierarchies?.[0]?.preferred_date_format ??  DATE_FORMAT.FORMATMDY;
        }

        this.getProgramConfig(program?.id)
        .subscribe((programDetails: any) => {
          if (programDetails && programDetails?.program && programDetails?.program?.config?.billing) {
            program['is_higher_submission_rate_allowed'] = programDetails.program.config.billing.is_higher_submission_rate_allowed;
          } else {
            program['is_higher_submission_rate_allowed'] = false;
          }
          if (programDetails && programDetails?.program && programDetails?.program?.config?.account_code) {
            this.storageService.set(StorageKeys.ACCOUNT_CODE_CONFIG, programDetails.program.config.account_code, true);
          } else {
            this.storageService.remove(StorageKeys.ACCOUNT_CODE_CONFIG);
          }
          if (programDetails && programDetails?.program && programDetails?.program?.root_hierarchy)
            program['root_hierarchy'] = programDetails?.program?.root_hierarchy;

          program['service_type'] = programDetails?.program?.service_type || '';
          program['config'] = programDetails.program.config;
          program['client'] = programDetails?.program?.client;
          program['msp'] = programDetails?.program?.msp;
          program['defaultCurrency'] = programDetails.program.config?.billing?.default_currency ?? 'USD'
          program['defaultDateFormat'] = programDetails.program.config?.preferred_date_format ?? DATE_FORMAT.FORMATMDY;
          if (programDetails.program?.tenure_modules) {
            program['config']['tenure_modules'] = programDetails.program?.tenure_modules;
          }
          if(programDetails?.program?.start_date) {
            program['start_date'] = programDetails?.program?.start_date;
          }
          if(programDetails?.program?.module_groups)
            program['module_groups'] = programDetails.program.module_groups;

          // Default currency edge case
          let supported_currencies: Array <string> = program.config?.billing?.supported_currencies ?? [];
          let defaultCurrency: string = program.config?.billing?.default_currency ?? null;
          if(!supported_currencies.includes(defaultCurrency) && ('default_currency' in (program.config?.billing ?? {}))) {
            program.config.billing.default_currency = null;
          }

          // Default language edge case
          let supported_languages: Array <string> = program.config?.localization?.supported_languages ?? [];
          let defaultLangage: string = program.config?.localization?.default_language ?? null;
          if(!supported_languages.includes(defaultLangage) && ('default_language' in (program.config?.localization ?? {}))) {
            program.config.localization.default_language = null;
          }

          this.storageService.set(StorageKeys.PROGRAM_ID, program?.id, true);
          this.storageService.set(StorageKeys.CURRENT_PROGRAM, program, storeInLocalStorage);

          // Fetch account details w.r.t. selected program
          this.getMembershipDetails(program?.id, this.userId)
            .subscribe({
              next: (res: any) => {
                if (res) {
                  this.storageService.set(StorageKeys.CURRENT_ACCOUNT, res?.member, true);
                  this.storageService.set(StorageKeys.USER_TYPE, res?.member.role.organization_category, true);
                  this.setUserPermissions(res?.member?.role?.permissions);
                }
              }, error: (err: any) => {
                console.error(err);
                this.alertService.error(errorHandler(err));
              },
            }
            );

          // let baseURLCode = program?.config?.submission_manager ? '/submission-manager' : '/configurator';
          let baseURLCode ='/submission-manager';
          this.storageService.set(StorageKeys.SUBMISSION_BASE_URL, baseURLCode, true);
          let newProgramJson = {
            program_uniqId: program?.unique_id,
            clientId: program?.client?.id,
            program_req_id: program?.id,
            clientName: program.client?.name,
          };
          this.storageService.set(
            StorageKeys.NEW_PROGRAM,
            JSON.stringify(newProgramJson),
            true
          );
          this.getAccuracyData(program?.id);
          // this.streamService.emit(new EmitEvent(Events.PROGRAM_SELECTED, program));
          this.streamService.emit(new EmitEvent(Events.PROGRAM_SIDEBAR, false));
          program.fromLogin = fromLogin;
          if(!impersonate_call) {
            this.streamService.emit(new EmitEvent(Events.SET_PROGRAM, program));
          }
        });
      });
    } else {
      this.streamService.emit(new EmitEvent(Events.SET_PROGRAM, { fromLogin: fromLogin }));
    }
  }

  getProgramModuleConfig(programId) {
    return this._http.get(`/configurator/programs/${programId}/hierarchy`);
  }
  getProgramConfig(programId) {
    return this._http.get(`/configurator/programs/${programId}`);
  }

  userLogout(forced: boolean = false) {
    if(forced) {
      this.userLogoutHelper();
      return;
    }

    this.confirmService
      .confirm('', `Are you sure you want to logout?`, 'Yes', 'No')
      .then((confirmed: boolean) => {
        if (confirmed) {
          this.userLogoutHelper();
        }
      })
      .catch((err: Error) => {
        console.error(err);
      });
  }

  private broadcastLogout() {
    this.storageService.set(StorageKeys.LOGOUT_EVENT,  Date.now().toString(), true);
  }


  private userLogoutHelper() {
    let userDefaultLangulage = this.storageService.get(StorageKeys.USER_LANGUAGE)
    this.storageService.clear();
    this.storageService.set(StorageKeys.USER_LANGUAGE, userDefaultLangulage, true);
    this.broadcastLogout();
    // this.router.navigate(['auth', 'login']);
    /** START: Temporary fix, until the Login and Dashboard Page is revamped */
    this.router.navigate(['auth', 'login']).finally(() => {
      window.location.reload();
    })
    /** END: Temporary fix, until the Login and Dashboard Page is revamped */
  }

  getAccuracyData(programId) {
    // @ProgramId is used to get the accuracy data for the selected program
    this.storageService.remove(StorageKeys.ACCURACY_CONFIG);
    var AccuracyConfigStatus = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.config?.accuracy_config;
      if(AccuracyConfigStatus){
        this._http.get(`/configurator/programs/${programId}/accuracy-config`).subscribe({
          next: (data: any) => {
            if (data?.total_records > 0) {
              this.storageService.set(StorageKeys.ACCURACY_CONFIG, data?.config_data[0], true);
            }
          },
          error: err => {
            this.alertService.error(errorHandler(err));
          },
        });
      }
  }

  getMembershipDetails(programId, memberId) {
    return this.get(`/configurator/programs/${programId}/members/${memberId}`);
  }

  setUserPermissions(list: Array<any>) {
    let permissions: Array<any> = [];
    if (Array.isArray(list)) {
      list?.forEach(element => permissions.push(element?.slug));
      this.storageService.set(StorageKeys.USER_PERMISSION, permissions, true);
    }
  }

  fetchProgramDetails(programId){
    return this._http.get(`/notification-config/programs/${programId}`);
  }

  fetchCurrentProgram(programId){
    return this._http.get(`/configurator/programs/${programId}`);
  }

  updateProgramConfigDetails(programId,payload){
    return this._http.put(`/notification-config/programs/${programId}`,payload)
  }

  get userId() {
    return this.storageService.get(StorageKeys.CURRENT_USER)?.id;
  }

  getGloballyDisbaledModules() {
    return this.get(`/configurator/global-launch?limit=50`)
  }

  getAllModulesList() {
    return this.get('/configurator/resources/module-groups').pipe(
      map((data: any) => {

        let result: Array <any> = [];
        const module_groups: Array <any> = data?.module_groups || [];

        if(Array.isArray(module_groups)) {

          module_groups?.forEach((mGroup: any) => {
            mGroup.is_enabled = false;
            mGroup.modules = mGroup.modules.map(module => {
              return {
                ...module,
                name: module.name,
                code: module.code,
                module_id: module.id,
                is_enabled: false,
                is_read_allowed: true,
                is_create_allowed: false,
                is_edit_allowed: false,
                is_delete_allowed: false,
              };
            });

            result.push(mGroup);
          });
        }

        // 'Global Launch' flag case
        result = result.filter(grp => !this.modulesToHide.includes(grp.name));
        return result;
      })
    )
  }

  get modulesToHide() {
    let globalLaunchService: GlobalLaunchService = this.injector.get(GlobalLaunchService);
    let modulesToHide: Array<string> = [];
    if (!globalLaunchService.isglobalLaunchSlugFlagEnabled('master_talent_module_enablement'))
      modulesToHide.push('Master Talent Profile');
    return modulesToHide;
  }
}
