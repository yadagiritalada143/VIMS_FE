import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Params } from '@angular/router';
import { Observable, Subject, Subscription, debounceTime, distinctUntilChanged, forkJoin, interval, of, switchMap, takeUntil } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { ProgramService } from 'src/app/programs/program.service';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { UniqueKeyPipe } from 'src/app/shared/pipe/unique-key.pipe';
import { errorHandler } from 'src/app/shared/util/error-handler';

type ListNode = { id: string, name: string };
type Query = { term: string, page: number };

@Component({
  selector: 'app-master-data-details',
  templateUrl: './master-data-details.component.html',
  styleUrls: ['./master-data-details.component.scss']
})
export class MasterDataDetailsComponent implements OnInit, OnDestroy {

  private masterId: string = null;
  private masterDetails: any = null;
  private subscriptions: Array <Subscription> = [];

  public status: boolean = true;
  public masterForm: UntypedFormGroup;
  public inputTextPattern: RegExp = /^[a-zA-Z0-9_ \-\/:]{1,}$/gm;
  public moduleOptions: Array <any> = ['OFF', 'OPTIONAL', 'REQUIRED'];

  private masterDataSub: Subject <Query> = new Subject <Query> ();
  
  public masterDataTypeList: Array <ListNode> = [];
  public masterDataTypeLoading: boolean = false;
  
  private prevMasterDataConfig: Query = null;
  private masterRecords: number = 20;

  public allowMultipleJobs: boolean = false;
  public allowMultipleSOWs: boolean = false;

  constructor (
    private fb: UntypedFormBuilder,
    private alert: AlertService,
    private route: ActivatedRoute,
    private loader: LoaderService,
    private storage: StorageService,
    private uniquePipe: UniqueKeyPipe,
    private sortHelper: SortHelperPipe,
    private svmsRouter: SvmsRouterService,
    private programService: ProgramService,
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe((param: Params) => {
      this.masterId = param?.id;
      if (this.isEditMode) {
        this.fetchMasterDetails();
      }
    });

    this.initializeForm();
    this.initializeMasterDataList();

    this.masterDataSub.next({ term: '', page: 1 });
  }

  private initializeForm() {
    this.masterForm = this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
      allow_multiple_default_values: [false],
      view_only: [false],
      user_association_exclude: [false],
      track_owner: [false],
      require_owner: [false],
      financial_master_data_type: [false],
      module_jobs: ['OPTIONAL', [Validators.required]],
      module_sow: ['OPTIONAL', [Validators.required]],
      master_data: [],
    })
  }

  private initializeMasterDataList() {
    this.subscriptions.push(
      this.masterDataSub.pipe(
        debounceTime(600),
        distinctUntilChanged((prev: Query, curr: Query) => {
          return (
            (prev?.term === curr?.term) &&
            (prev?.page === curr?.page)
          );
        }), switchMap((evt: any) => {

          let { term = '', page = 1 } = evt;
          this.prevMasterDataConfig = { term, page };
          let url = `/configurator/programs/${this.programId}/foundational-data-types?limit=20&active=true`;

          if (term)
            url += `&name=${term}`;

          if (page)
            url += `&page=${page}`;

          this.masterDataTypeLoading = true;
          return forkJoin([this.programService.get(url), of(page)]);
        })
      ).subscribe({
        next: (res: any) => {
          if (Array.isArray(res) && res.length) {

            let fd_types: Array <any> = res[0]?.foundational_data_types;
            let page: number = res[1];

            this.masterRecords = res[0]?.total_records;
            if (Array.isArray(fd_types)) {

              let data: Array <any> = fd_types.map((fd_type: any) => {
                return {
                  name: fd_type?.name || '--',
                  id: fd_type?.id,
                  dependent_foundational_data_types: fd_type?.dependent_foundational_data_types || []
                }
              });

              if(page !== 1) {
                data = [...this.masterDataTypeList, ...data];
              }

              this.masterDataTypeList = this.sortHelper.transform(
                this.uniquePipe.transform(data, 'id')
              , 'name');

              this.masterDataTypeLoading = false;
              this.computeMDTExclusions();
            }
          }
        }, error: (err: any) => {
          console.error(err);
          this.alert.error('Error encountered while fetching master data entries!');
          this.masterDataTypeLoading = false;
          this.initializeMasterDataList();
        }
      })
    );
  }

  private fetchMasterDetails() {

    let url: string = `/configurator/programs/${this.programId}/foundational-data-types/${this.masterId}`;

    this.loader.show();
    this.programService.get(url).subscribe({
        next: (res: any) => {

        this.loader.hide();
        if('foundational_data_type' in res) {
          res = res?.foundational_data_type;
        }

        this.masterDetails = res;
        this.initializeValues();
      }, error: (err: Error | any) => {
        this.loader.hide();
        console.error(err);
        this.alert.error((errorHandler(err)));
      }
    });
  }

  private initializeValues() {

    let {
      name, is_enabled, description,
      user_association_exclude,
      configuration: {
        allow_multiple_default_values,
        require_owner,
        financial_master_data_type,
        track_owner,
        module_sow,
        module_jobs,
        view_only,
        allow_multiple_jobs,
        allow_multiple_sows
      },
      dependent_foundational_data_types: master_data,
    } = this.masterDetails;

    this.status = is_enabled;
    this.allowMultipleJobs = (allow_multiple_jobs === 'true');
    this.allowMultipleSOWs = (allow_multiple_sows === 'true');

    this.masterForm.patchValue({
      name, description, user_association_exclude,
      financial_master_data_type: (financial_master_data_type === 'true'),
      allow_multiple_default_values: (allow_multiple_default_values === 'true'),
      require_owner: (require_owner === 'true'),
      track_owner: (track_owner === 'true'),
      view_only: (view_only === 'true'),
      module_sow, module_jobs,
    });

    this.queueMasterDataInit(master_data);
  }

  private createPayload(): any {

    let value: any = this.masterForm?.value || {};
    let result: any = {
      name: value?.name,
      description: value?.description || '',
      is_enabled: this.status || false,
      user_association_exclude: value?.user_association_exclude || false,
      configuration: {
        hierarchy_included: "OPTIONAL",
        module_jobs: value?.module_jobs || 'OFF',
        module_sow: value?.module_sow || 'OFF',
        allow_multiple_default_values: ("" + value?.allow_multiple_default_values) || "false",
        view_only: ("" + value?.view_only) || 'false',
        financial_master_data_type: ('' + value?.financial_master_data_type) || 'false',
        require_owner: ("" + (value?.require_owner && value?.track_owner)) || 'false',
        track_owner: ("" + value?.track_owner) || 'false',
        allow_multiple_jobs: ("" + this.allowMultipleJobs) || 'false',
        allow_multiple_sows: ("" + this.allowMultipleSOWs) || 'false'
      }
    };

    let fdMap: Map <string, boolean> = new Map <string, boolean> ();
    let dependent_foundational_data_types: Array <any> = [];
    
    if(this.isEditMode) {
      let fd_entries: Array <string> = (this.masterDetails?.dependent_foundational_data_types || []).map((entry: any) => entry?.id);
      this.setMapValues(fd_entries, fdMap, false);
    }

    // Master Data
    this.setMapValues(value?.master_data, fdMap, true);
    for(let [key, value] of fdMap) {
      dependent_foundational_data_types.push({
        [key]: value
      })
    }

    if(dependent_foundational_data_types?.length) {
      result = {
        ...result,
        dependent_foundational_data_types
      };
    }

    return result;
  }

  private apiObservable(url: string, payload: any): Observable <any> {
    if(this.isEditMode) {
      url += `/${this.masterId}`;
      return this.programService.put(url, payload);
    }

    return this.programService.post(url, payload);
  }

  backClicked() {
    this.svmsRouter.navigate(['program', 'master-data-type', 'list']);
  }

  trimField(controlName: string) {
    const form: AbstractControl = this.masterForm.get(controlName);
    form.setValue(form.value.trim());
  }

  onSave() {
    if(this.masterForm.valid) {

      let url: string = `/configurator/programs/${this.programId}/foundational-data-types`;
      let payload: any = this.createPayload();

      this.loader.show();
      this.apiObservable(url, payload).subscribe({
        next: (res: any) => {
          if(res?.id) {
            this.loader.hide();
            this.alert.success(`Master data Type ${ this.isCreateMode?'Created':'Updated'} Successfully!`);
            this.svmsRouter.navigate(['program', 'master-data-type', 'view', res?.id]);
          }
        }, error: (err: any) => {
          console.error(err);
          this.alert.error(errorHandler(err));
          this.loader.hide();
        }
      });
    } else {
      this.alert.error("Please address all the validation errors!");
      this.masterForm.markAllAsTouched();
    }
  }

  selectedValues(name: string, values: Array <string>) {
    this.masterForm.get(name).setValue(values);
  }

  searchTerm(name: string, term: string) {
    switch(name) {
      case 'master_data':
        this.masterDataSub.next({term, page: 1});
        break;
    }
  }

  scrolledToEnd(name: string, evt: any) {
    switch (name) {
      case 'master_data':
        if (!this.masterDataTypeLoading && this.masterDataTypeList.length < this.masterRecords) {
          this.masterDataSub.next({
            ...this.prevMasterDataConfig,
            page: (this.prevMasterDataConfig?.page || 0) + 1
          });
        }
        break;
    }
  }

  disableMultipleToggle(field: string, value: string) {
    if(value === 'OFF') {
      switch(field) {
        case 'module_sow':
          this.allowMultipleSOWs = false;
          break;
        case 'module_jobs':
          this.allowMultipleJobs = false;
          break;
      }
    }
  }

  private queueMasterDataInit(data: Array<any>) {

    let destroySub$: Subject<void> = new Subject<void>();
    let entries: Array<ListNode> = (data || []).map((entry: any) => {
      return {
        id: entry?.id,
        name: entry?.name || '--',
        dependent_foundational_data_types: entry?.dependent_foundational_data_types || []
      }
    });

    interval(200)
      .pipe(takeUntil(destroySub$))
      .subscribe(() => {
        if (this.masterDataTypeLoading === false) {
          destroySub$.next();
          this.masterDataTypeList = this.sortHelper.transform(
            this.uniquePipe.transform([
              ...this.masterDataTypeList,
              ...entries
            ], 'id')
            , 'name');

          this.computeMDTExclusions();
          this.masterForm.patchValue({
            master_data: entries.map((entry: any) => entry?.id)
          });
        }
      });
  }

  private setMapValues(values: Array <string>, mp: Map <string, boolean>, flag: boolean) {
    if(Array.isArray(values)) {
      values.forEach((id: string) => {
        mp.set(id, flag);
      })
    }
  }

  private excludedAssociations: Array <string> = [];
  private computeMDTExclusions() {
    if(Array.isArray(this.masterDataTypeList)) {

      let results: Array <string> = [this.masterId];
      this.masterDataTypeList.forEach((entry: any) => {

        const id: string = entry?.id || '';
        const dependent_foundational_data_types: Array <string> = (entry?.dependent_foundational_data_types || []).map((type: any) => (type?.id || ''));
        
        // Exclude dependent foundational data types
        if(dependent_foundational_data_types.includes(this.masterId)) {
          results.push(id);
        }
      });

      this.excludedAssociations = results;
    }
  }

  get programId(): string {
    return this.storage.get(StorageKeys.PROGRAM_ID);
  }

  get isEditMode(): boolean {
    return !!this.masterId;
  }

  get isCreateMode(): boolean {
    return !this.masterId;
  }

  get pageTitle(): string {
    if(this.isCreateMode) {
      return 'Create New Master Data Type';
    }

    return 'Edit ' + (this.masterDetails?.name || 'Master Data Type');
  }

  get allowedMasterDataTypes() {
    return this.masterDataTypeList.filter((entry: any) => !this.excludedAssociations.includes(entry?.id));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub?.unsubscribe());
  }
}
