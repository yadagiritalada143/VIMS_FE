import { Component, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { LoaderService } from '../core/components/loader/loader.service';
import { StorageKeys, StorageService } from '../core/services/storage.service';
import { UserService } from '../core/services/user.service';
import { forkJoin } from 'rxjs';
import { errorHandler } from '../shared/util/error-handler';
import { AlertService } from '../core/components/alert/alert.service';
import { TimesheetService } from '../wipro-timesheet/timesheet.service';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationDialogService } from '../shared/components/confirmation-dialog/confirmation-dialog.service';
import { Log, LOG_TYPE } from '../library/logs/logs.model';
import { AccountCodeService } from './services/account-code-setup.service';
import { AccountCodeValidationParams, AccountCodeValidationPayload, AccoutCodeValidationRequest } from './models/account-code-setup-model';
import { AccountCodeData, AccountCodeFields } from '../library/account-code-generate/models/account-code-data';
export enum UserType {
  Worker = 'CANDIDATE'
}
@Component({
  selector: 'app-account-code-setup',
  templateUrl: './account-code-setup.component.html',
  styleUrls: ['./account-code-setup.component.scss']
})
export class AccountCodeSetupComponent implements OnInit {
  fixedFoundationDataSet = [];
  accountConfig = undefined;
  viewMode: string = undefined;
  currentProgram: any = undefined;
  foundationTypeList: any[] = [];
  public accountCodeForm: UntypedFormGroup;
  _foundationTypelist: any[] = [];
  pageNo: number = 1;
  accountCodeList: any = undefined;
  history: any = [];
  selectedStatus: string = undefined;
  showFilters = false;
  workerId: string = undefined;
  assignmentId: string = undefined;
  configurationNotExist = false;
  logs: Log = undefined;
  accountCodeLogs: Log = undefined;
  historyLogs: Log = undefined;
  hideMasterDataTypeName : boolean;
  isValidAccountCode: boolean;
  public subscription : any;
  constructor(private storageService: StorageService, private timesheetService: TimesheetService,
    private _loader: LoaderService, private _alert: AlertService, private datePipe: DatePipe,
    private fb: UntypedFormBuilder, public userService: UserService, private route: ActivatedRoute,
    private confirmService: ConfirmationDialogService,
    private accountCodeService: AccountCodeService, public router: Router) { }

  ngOnInit(): void {
    this.viewMode = "account_code";
    this.route.queryParams.subscribe(params => {
      this.workerId = params['workerId'];
      this.assignmentId = params['assignmentId'];
      // For Candidate only
      let account = this.storageService.get(StorageKeys?.CURRENT_ACCOUNT);
      const isCandidate = account?.role?.organization_category?.toLowerCase() === UserType?.Worker?.toLowerCase();
      if (!this.workerId && isCandidate) {
        this.getWorkerList();
      }
    });
    this.currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.hideMasterDataTypeName = this.currentProgram?.config?.show_only_master_codes ?? false;
    this.accountConfig = this.storageService.get(StorageKeys.ACCOUNT_CODE_CONFIG);
    if (this.accountConfig && this.accountConfig?.components) {
      this.fixedFoundationDataSet = this.accountConfig?.components;
      if (this.fixedFoundationDataSet && this.fixedFoundationDataSet.length > 0) {
        this.fixedFoundationDataSet = this.fixedFoundationDataSet.sort((config1, config2) => config1?.sort - config2?.sort);
      }
    } else {
      this.configurationNotExist = true;
    }
    this.createForm();
    this.getFoundantionalType(this.pageNo = 1);
    this.getAccountCodeList();
    this.getAccountCodeHistory();
  }

  goToBack() {
    const queryParams = { tab: 'assignment' };
    if (this.router?.url?.includes('assignmentId')) {
      this.router.navigate([`assignment/details/${this.assignmentId}/final`], { queryParams });
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  getWorkerList() {
    this.timesheetService.getWorkersList(this.currentProgram?.id).subscribe({
      next: (data: any) => {
        let workers = data?.data?.worker;
        if (workers && workers?.length > 0) {
          this.workerId = workers[0].worker_id;
          this.getAssignment(this.workerId);
        } else {
          this.logs = { type: LOG_TYPE.ERROR, heading: "Oops! Worker info is not available!", autoClose: true, isShown: true };
        }
      },
      error: err => {
        this.logs = { type: LOG_TYPE.ERROR, heading: "Something went wrong with getting programs! Please try again later", autoClose: true, isShown: true };
      }
    });
  }

  getAssignment(workerId) {
    this.logs = undefined;
    let _url = `/assignment/programs/${this.currentProgram?.id}/worker/${workerId}/assignment?is_timesheet_enabled=true`;
    this.timesheetService.get(_url).subscribe({
      next: (data: any) => {
        if (data) {
          let assignment = data?.data;
          if (assignment && assignment.length == 1) {
            this.assignmentId = assignment[0]?.assignment_uuid;
          }
        }
      },
      error: err => {
        this.logs = { type: LOG_TYPE.ERROR, heading: errorHandler(err), messages: this.showErrorMessges(err), autoClose: true, isShown: true, showReportButton: err?.status == 500 || err?.status == 404, additionalInfo: { trace_id: err?.error?.trace_id } };
        // this.showError(err);
      }
    });
  }


  createForm() {
    this.accountCodeForm = this.fb.group({
      foundational_data: this.fb.array([]),
    });
  }


  getAccountCodeHistory() {
    this.historyLogs = undefined;
    this.timesheetService.getAccountCodeHistory('worker_code', undefined, this.workerId).subscribe({
      next: (res: any) => {
        res?.data?.history.forEach(item => {
          let filterDate = this.datePipe.transform(item?.updatedat, 'dd/MM/yyyy hh:mm:ss');
          let x = filterDate?.split(' ');
          item['updatedDate'] = x[0];
          item['updatedTime'] = x[1];
        })
        this.history = res?.data?.history;
      },
      error: error => {
        this.historyLogs = { type: LOG_TYPE.ERROR, heading: error?.error?.error?.message, messages: this.showErrorMessges(error), autoClose: true, isShown: true, showReportButton: error?.status == 500 || error?.status == 404, additionalInfo: { trace_id: error?.error?.error?.trace_id } };
        // this._alert.error(errorHandler(err));
      }
    });

  }


  async getFoundantionalType(pageNo = 1) {
    this.logs = undefined;
    if (pageNo === 1) {
      this._loader.show();
    }
    this.userService.getFoundantionalType(this.currentProgram?.id).subscribe({
      next: (data: any) => {
        const { foundational_data_types } = data;
        let foundational_types = [];
        if (this.fixedFoundationDataSet != null && this.fixedFoundationDataSet.length > 0) {
          this.fixedFoundationDataSet.forEach(fds => {
            foundational_data_types?.forEach(fd => {
              if (fd?.slug?.toLowerCase() === fds?.slug?.toLowerCase()) {
                fd.isRequired = fds.is_mandatory;
                fd.key_slug = fds.key_slug;
                foundational_types.push(fd);
              }
            });
          })
          if (foundational_types && foundational_types.length == 0) {
            this.configurationNotExist = true;
          }
        } else {
          this.configurationNotExist = true;
        }
  
        /* this.foundationTypeList = foundational_data_types?.filter(fd => {
          return fd?.configuration && fd?.configuration?.module_jobs !== 'OFF';
        }).map(fd => {
          fd.code = this.snakeCase(fd.name);
          return fd;
        }); */
        this.foundationTypeList = foundational_types;
        const foundationalDataHttp = this.foundationTypeList.map(dataType => {
          return this.userService.get(`/configurator/programs/${this.currentProgram?.id}/foundational-data-types/${dataType?.id}/foundational-data`);
        });
  
        let foundationalValue: any[] = [];
        forkJoin(foundationalDataHttp).subscribe({
          next: (res: any) => {
            foundationalValue = res.map(foundData => foundData?.foundational_data);
            foundationalValue.forEach((val, index) => {
              this.foundationTypeList[index].values = val;
            });
            this.foundationTypeList = [...this.foundationTypeList];
            this._foundationTypelist = this.chunkArray(this.foundationTypeList, 3);
            this.updateFoudationalForm();
          },
          error: err => {
            this.logs = { type: LOG_TYPE.ERROR, heading: errorHandler(err), messages: this.showErrorMessges(err), autoClose: true, isShown: true, showReportButton: err?.status == 500 || err?.status == 404, additionalInfo: { trace_id: err?.error?.trace_id } };
          }
        });
      },
      error: error => {
        this.logs = { type: LOG_TYPE.ERROR, heading: errorHandler(error), messages: this.showErrorMessges(error), autoClose: true, isShown: true, showReportButton: error?.status == 500 || error?.status == 404, additionalInfo: { trace_id: error?.error?.error?.trace_id } };
        // this._alert.error(errorHandler(error), {});
        this._loader.hide();
      },
      complete: () => {
        this._loader.hide();
      }
    });
  }

  updateFoudationalForm() {
    this.foundationTypeList.forEach(element => {
      // const isRequired = element?.configuration?.module_jobs?.toUpperCase() === 'REQUIRED';
      this.foundationalDataArray.push(
        this.fb.group({
          is_required: [element?.isRequired],
          foundational_data_name: [element.name],
          foundational_data_type_id: [element.id],
          values: [null, element?.isRequired ? [Validators.required] : []],
          options: [element.values],
          slug: element.slug,
          key_slug: element.key_slug
        })
      )
    });
    this._loader.hide();
  }

  getfoundationalData(term, fondationDataType, index) {
    this.logs = undefined;
    if (fondationDataType && fondationDataType?.get('foundational_data_type_id')?.value) {
      let dataTypeId = fondationDataType?.get('foundational_data_type_id')?.value;
      let url = `/configurator/programs/${this.currentProgram?.id}/foundational-data-types/${dataTypeId}/foundational-data?k=${term.term}`;
      this.userService.get(url).subscribe({
        next: (data: any) => {
          if (data && data.foundational_data && data?.foundational_data.length > 0) {
            let controlArray = <UntypedFormArray>this.accountCodeForm.controls["foundational_data"];
            controlArray.controls[index].patchValue({ options: data?.foundational_data });
            // this.skeletonLoading = false;
          }
        },
        error: error => {
          // this.skeletonLoading = false;
          this.logs = { type: LOG_TYPE.ERROR, heading: errorHandler(error), messages: this.showErrorMessges(error), autoClose: true, isShown: true, showReportButton: error?.status == 500 || error?.status == 404, additionalInfo: { trace_id: error?.error?.error?.trace_id } };
          // this._alert.error(errorHandler(error), {});
          this._loader.hide();
        },
        complete: () => {
          // this.skeletonLoading = false;
          this._loader.hide();
        }
      });
    }

  }

  // get foundationlGroupForm() {
  //   return this.accountCodeForm.get('foundational_data') as FormGroup;
  // }

  snakeCase = string => {
    string = string.toLowerCase();
    return string.replace(/\W+/g, ' ')
      .split(/ |\B(?=[A-Z])/)
      .map(word => word.toLowerCase())
      .join('_');
  }

  chunkArray(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      const chunk = array.slice(i, i + size);
      if (chunk.length < size) {
        chunk.push({ hidden: true });
      }
      result.push(chunk);
    }
    return result;
  }

  get foundationalDataArray() {
    return (this.accountCodeForm.get('foundational_data') as UntypedFormArray || new UntypedFormArray([]));
  }

  createAccountCode() {
    this.logs = undefined;
    if (this.accountCodeForm?.valid) {
      if (this.accountConfig?.is_validation_required) {
        if(this.subscription) {
          this.subscription.unsubscribe();
        }
        let accountCodeSelected = this.getVerifyAccountCodePayload();
        this.subscription = this.accountCodeService.verifyAccountCodeToken(this.currentProgram.id, accountCodeSelected).subscribe({
          next: (result: any) => {
            if (result) {
              if (result?.response?.isValid) {
                this.isValidAccountCode = true;
                this.generateAccountCode();
              } else {
                this.logs = { type: LOG_TYPE.ERROR, heading: result?.response?.message, autoClose: true, isShown: true };
              }
            }
          },
          error: err => {
            this.logs = { type: LOG_TYPE.ERROR, heading: errorHandler(err), messages: this.showErrorMessges(err), autoClose: true, isShown: true, showReportButton: err?.status == 500 || err?.status == 400, additionalInfo: { trace_id: err?.error?.error?.trace_id } };
          }
        })
      } else {
        this.isValidAccountCode = true;
        this.generateAccountCode();
      }
    } else {
      this.logs = { type: LOG_TYPE.ERROR, heading: "Please select all compulsary fields", autoClose: true, isShown: true };

      // this._alert.error("Please select all compulsary fields");
    }
  }

  showErrorMessges(err) {
    let messages = [];
    err?.error?.error?.errors?.forEach(msg => {
      if (msg?.message) {
        messages.push(msg?.message);
      }
    });
    return messages;
  }

  updateAccountCodeStatus(payload) {
    if (payload?.status === 'active') {
      this.confirmService.confirm('', `Do you really want to inactive this Account code?`,
        'Yes', 'No')
        .then((confirmed) => {
          if (confirmed) {
            payload.status = 'in-active';
            this.updateAccountCode(payload);
          }
        })
        .catch(() => { });
    } else {
      payload.status = 'active';
      this.updateAccountCode(payload);
    }
  }

  updateAccountCode(payload) {
    if (this.workerId) {
      payload.worker_id = this.workerId;
    }
    this.timesheetService.updateAccountCodes(payload).subscribe({
      next: res => {
        payload.showDropdown = false;
        this.getAccountCodeList();
      },
      error: err => {
        this._alert.error(errorHandler(err));
      }
    })
  }

  getAccountCodeFieldDetails = (code,title) => {
    let value: AccountCodeData = new AccountCodeData();
    value.is_validated = this.isValidAccountCode;
    if (this.isValidAccountCode) {
      value.account_code = code;
      value.account_title = title;
      value.fields = new Array<AccountCodeFields>();
      this.accountCodeForm.value.foundational_data.forEach(foundational_data => {
        // && foundational_data.values
        if (foundational_data) {
          let field: AccountCodeFields = new AccountCodeFields();
          field.foundational_data_type_id = foundational_data?.foundational_data_type_id;
          field.foundation_data_id = foundational_data?.values?.id;
          field.slug = foundational_data?.slug;
          field.key_slug = foundational_data?.key_slug;
          field.value = { name: foundational_data?.values?.name, code: foundational_data?.values?.code }
          value.fields.push(field);
        }
      });
    }
    return value;
  }

  generateAccountCode = () => {
    let accountcode = '';
    let accounttitle = '';
    let codeSeparator = this.accountConfig?.component_separator;
    if (!codeSeparator || codeSeparator === '') {
      codeSeparator = '-'
    }
    this.accountCodeForm.value.foundational_data.forEach(foundational_data => {
      if (foundational_data?.values?.name && foundational_data?.values?.name !== '') {
        accountcode = accountcode ? `${accountcode}${codeSeparator}${foundational_data?.values?.code}` : foundational_data?.values?.code;
        accounttitle = accounttitle ? `${accounttitle}${codeSeparator}${foundational_data?.values?.name}` : foundational_data?.values?.name;
      } else {
        accountcode = `${accountcode}${codeSeparator}`;
        accounttitle = `${accounttitle}${codeSeparator}`;
      }
    });
    const payload: any = {
      type: "account_code",
      value: this.getAccountCodeFieldDetails(accountcode,accounttitle),
    }
    if (this.workerId) {
      payload.worker_id = this.workerId;
    }
    this.timesheetService.saveAccountCodes(payload).subscribe({
      next: (res: any) => {
        if (res?.message && res?.code == 200) {
          this._alert.success(res?.message);
          this.getAccountCodeList();
          this.createForm();
          this.updateFoudationalForm();
        }
      },
      error: err => {
        this._alert.error(errorHandler(err));
      }
    });
  }

  getVerifyAccountCodePayload = (): AccoutCodeValidationRequest => {
    let verificationPayload: AccoutCodeValidationRequest = new AccoutCodeValidationRequest()
    verificationPayload.params = new AccountCodeValidationParams();
    verificationPayload.params.worker_id = this.workerId;
    verificationPayload.params.module_name = 'assignment';
    verificationPayload.params.action = 'create';
    verificationPayload.params.unit_id = this.assignmentId || "";
    verificationPayload.payload = new AccountCodeValidationPayload();
    this.accountCodeForm.value.foundational_data.forEach(foundational_data => {
      if (foundational_data) {
        verificationPayload.payload[foundational_data.key_slug] = foundational_data.values?.code ?? '';
      }
    });
    return verificationPayload;
  }

  getAccountCodeList() {
    this.accountCodeLogs = undefined;
    this.timesheetService.getAccountCodesList(this.workerId, this.selectedStatus).subscribe({
      next: (res: any) => {
        this.accountCodeList = res?.data?.worker;
      },
      error: err => {
        this.accountCodeLogs = { type: LOG_TYPE.ERROR, heading: err?.error?.error?.message, messages: this.showErrorMessges(err), autoClose: true, isShown: true, showReportButton: err?.status == 500 || err?.status == 404, additionalInfo: { traceId: err?.error?.error?.traceId } };
        // this._alert.error(errorHandler(err));
        this.accountCodeList = undefined;
      }
    });
  }

  showFilter() {
    this.showFilters = true;
  }

  hideFilter() {
    this.showFilters = false;
  }

  setSelectedStatus(status) {
    if (this.selectedStatus === status) {
      this.selectedStatus = undefined;
    } else {
      this.selectedStatus = status;
    }
    this.getAccountCodeList();
    this.hideFilter();
    console.warn(status);
  }
}
