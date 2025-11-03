import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Params } from '@angular/router';
import { Observable, Subject, Subscription, debounceTime, distinctUntilChanged, forkJoin, interval, lastValueFrom, of, switchMap, takeUntil } from 'rxjs';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { MasterDataItemsService } from '../master-data-items.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { ProgramService } from 'src/app/programs/program.service';
import { ModalItemConfig } from 'src/app/self-configuration/components/selector-modal/selector-modal.component';
import { CustomFieldsComponent } from 'src/app/library/custom-fields/custom-fields/custom-fields.component';
import { CommonService } from 'src/app/library/custom-fields/common.service';
type Query = { page: number, term: string };

@Component({
  selector: 'app-master-data-item-detail',
  templateUrl: './master-data-item-detail.component.html',
  styleUrls: ['./master-data-item-detail.component.scss']
})
export class MasterDataItemDetailComponent implements OnInit, OnDestroy {

  private subscriptions: Array <Subscription> = [];
  private itemDetails: any = null;
  private itemId: string = null;

  public masterId: string = null;
  public masterName: string = null;
  public masterDetails: any = null;

  public status: boolean = true;
  public masterForm: UntypedFormGroup;
  public inputTextPattern: RegExp = /^[a-zA-Z0-9_ \-\/:]{1,}$/gm;

  public ownerList: Array <any> = [];
  public ownerLoading: boolean = false;
  public prevOwnerConfig: Query = null;
  public totalOwners: number = Number.POSITIVE_INFINITY;
  public ownerSubject: Subject <Query> = new Subject <Query>();

  public depended_fields: Array <SecondaryFieldConfig> = [];

  // Client/MSP based custom fields
  @ViewChild(CustomFieldsComponent) cfCmp: CustomFieldsComponent;
  public updatedCFs: Array <any>;
  public recievedCFs: Array <any>;
  public isCFValid: boolean = true;

  constructor(
    private fb: UntypedFormBuilder,
    private alert: AlertService,
    private route: ActivatedRoute,
    private loader: LoaderService,
    private storage: StorageService,
    private svmsRouter: SvmsRouterService,
    private programService: ProgramService,
    private dataService: MasterDataItemsService,
    private cfService: CommonService
  ) { }

  ngOnInit(): void {

    this.route.params.subscribe((param: Params) => {

      this.masterId = param?.id;
      this.itemId = param?.item;

      this.loader.show();
      this.fetchMasterDetails().then((res: any) => {

        if('foundational_data_type' in res) {
          res = res?.foundational_data_type;
        }

        this.masterDetails = res;
        this.setConditionalValidations();
        this.initializeSecondaryFields();

        if(this.isEditMode) {
          this.fetchMasterItemDetails();
        } else {
          this.loader.hide();
        }
      }, (err: any) => {
        this.loader.hide();
        console.error(err);
        this.alert.error((errorHandler(err)));
      });
    });

    this.route.queryParams.subscribe((param: Params) => {
      this.masterName = param?.name;
    });

    this.initializeForm();
    this.initializeOwnerSub();
    this.ownerSubject.next({ term: '', page: 1 });
  }

  initializeForm() {
    this.masterForm = this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
      code: ['', [Validators.required]],
      owner: [null]
    });
  }

  initializeOwnerSub() {
    this.subscriptions.push(
      this.ownerSubject.pipe(
        distinctUntilChanged((prev: Query, curr: Query) => {
          return (
            (prev?.term === curr?.term) && 
            (prev?.page === curr?.page)
          );
        }),
        debounceTime(600),
        switchMap((query: Query) => {

          this.prevOwnerConfig = query;
          let { term = '', page = 1 } = query;
          let url = `/configurator/programs/${this.programId}/members?org_category=CLIENT&page=${page}`;
          if (term) {
            url += `&name=${term}`;
          }

          this.ownerLoading = true;
          return forkJoin([this.programService.get(url), of(page)]);
        })
      ).subscribe({
        next: (response: any) => {
          if (Array.isArray(response)) {

            const res: any = response?.[0];
            const page: number = response?.[1];

            this.totalOwners = res?.total_records ?? 0;
            let result: Array <any> = (res?.members || []).map((entry: any) => {
              let { first_name = '', last_name = '', full_name = '' } = entry;
              return {
                ...entry,
                full_name: full_name || (first_name + ' ' + last_name)?.trim() || '--'
              } 
            });

            if(page === 1) {
              this.ownerList = result;
            } else {
              this.ownerList = [...this.ownerList, ...result];
            }

            this.ownerLoading = false;
          }
        }, error: (err: any) => {
          console.error(err);
          this.ownerLoading = false;
          this.alert.error('Error encountered while fetching Owner entries!');
        }
      })
    );
  }

  backClicked() {
    this.svmsRouter.navigate(['program', 'master-data-type', 'list-foundational-data', this.masterId, 'list']);
  }

  trimField(controlName: string) {
    const form: AbstractControl = this.masterForm.get(controlName);
    form.setValue(form.value.trim());
  }

  showMoreOwners() {
    if(!this.ownerLoading) {
      if(this.ownerList?.length < this.totalOwners) {
        this.ownerSubject.next({
          term: this.prevOwnerConfig?.term || '',
          page: (this.prevOwnerConfig?.page || 0) + 1
        });
      }
    }
  }

  showMoreDependedFields(entity: SecondaryFieldConfig) {
    const {subject, prevQuery, totalRecords, fields, loading} = entity;
    if(!loading) {
      if(totalRecords > fields?.length) {
        if(subject && prevQuery) {
          subject.next({
            term: prevQuery?.term || '',
            page: (prevQuery?.page || 0) + 1
          });
        }
      }
    }
  }

  searchDependedFields(term: string, entity: SecondaryFieldConfig) {
    const { subject } = entity;
    subject?.next({
      term: term || '',
      page: 1
    });
  }

  onSave() {
    this.cfCmp?.onEmit();
    if(this.masterForm?.valid && this.isCFValid) {

      let url: any = `/configurator/programs/${this.programId}/foundational-data-types/${this.masterId}/foundational-data`;
      let payload: any = this.createPayload();

      if(typeof(payload) === 'string') {
        this.alert.error(payload);
        return;
      }

      this.loader.show();
      this.apiChangeObservable(url, payload).subscribe({
        next: (res: any) => {
          this.loader.hide();
          this.alert.success(`Master data ${this.isCreateMode?'created':'updated'} successfully`);
          this.svmsRouter.navigate(['program', 'master-data-type', 'list-foundational-data', this.masterId, 'view', res?.id]);
        }, error: (err: Error | any) => {
          this.loader.hide();
          console.error(err);
          this.alert.error(errorHandler(err));
        }
      });
    } else {
      this.alert.error("Please specify all the required fields correctly!");
      this.masterForm?.markAllAsTouched();
    }
  }

  noDefaultSelected(fields: Array <ModalItemConfig>): boolean {
    if(Array.isArray(fields)) {
      fields = fields.filter((entry: ModalItemConfig) => entry?.is_selected);
      if(!fields.length) {
        return false;
      }

      return !fields.reduce((prev: boolean, entry: ModalItemConfig) => {
        return (entry?.is_default || prev)
      }, false);
    }

    return false;
  }
 
  private async fetchMasterDetails(): Promise <any> {
    return await lastValueFrom(this.dataService.masterFieldDetail(this.masterId));
  }

  private fetchMasterItemDetails(): any {
    let url = `/configurator/programs/${this.programId}/foundational-data-types/${this.masterId}/foundational-data/${this.itemId}`;
    this.programService.get(url).subscribe({
      next: (res: any) => {
        
        this.loader.hide();
        if('foundational_data' in res) {
          res = res?.foundational_data;
        }

        this.itemDetails = res;
        this.populateDetails();

        if(this.allowedMDTuserType) {
          this.cfService.queueCFpopulation(res?.['custom_fields_value_mapping'] || {}, this.cfCmp).then((cfs: any) => {
            this.recievedCFs = cfs;
          });
        }
      },  error: (err: any) => {
        this.loader.hide();
        console.error(err);
        this.alert.error(errorHandler(err));
      }
    })
  }

  private populateDetails() {

    let {
      code = '',
      manager = [],
      name = '',
      description = '',
      is_enabled = false
    } = this.itemDetails;

    this.status = is_enabled;
    if(Array.isArray(manager)) {
      manager = manager.map((item: any) => {
        let { first_name = '', middle_name = '', last_name = '' } = item;
        middle_name = (!middle_name || middle_name?.toLowerCase() === 'null')?'':middle_name;
        let full_name: string = (first_name + ' ' + middle_name + ' ' + last_name).trim().replace(/[ ]{2,}/, ' ');
        this.queueOwnerEntry({ id: item?.user_id, full_name });
        return item?.user_id;
      });
    }

    this.masterForm.patchValue({
      name, code, description,
      owner: manager?.[0] || null
    });

    this.initializeDependedFields();
  }

  private setConditionalValidations() {
    const ownerForm: AbstractControl = this.masterForm?.get('owner');
    if(this.ownerMandatory) {
      ownerForm?.addValidators([Validators.required]);
    }
  }

  private createPayload(): string | any {

    let errorMessage: string = null;
    const values: any = this.masterForm?.value;
    let result: any = {
      name: values?.name,
      is_enabled: this.status,
      manager_id: values?.owner,
      description: values?.description,
      code: values?.code,
      foundational_data_mapping: []
    };

    if(this.allowedMDTuserType) {
      result['custom_fields_value_mapping'] = this.cfService.amendCFData(this.updatedCFs);
    }

    this.depended_fields.forEach((value: SecondaryFieldConfig) => {

      let values: Array <any> = [];
      let restrict_value: boolean = value?.restrict_values;
      let foundational_data_type_id: string = value?.id;
      let fields: Array <ModalItemConfig> = value?.fields || [];

      let recievedEntries: Array <string> = (this.itemDetails?.foundational_data_mapping || [])
        ?.find((entry: any) => entry?.foundational_data_type_id === foundational_data_type_id)
        ?.values?.map((data: any) => data?.id) || [];

      let default_count: number = 0;
      if(Array.isArray(fields)) {
        fields.forEach((entry: ModalItemConfig) => {
          if(entry?.is_selected) {
            if(entry?.is_default) {
              default_count++;
            }

            values.push({
              id: entry?.value,
              keep: true,
              is_editable: entry?.is_editable || false,
              is_default: entry?.is_default || false
            })
          } else if(recievedEntries.includes(entry?.value)) {
            values.push({
              keep: false,
              id: entry?.value
            });
          }
        });
      }

      // if(values.filter((val: any) => val?.keep)?.length) {
      //   if(default_count === 0) {
      //     errorMessage = `No default value selected for ${value?.name}!`;
      //   }
      // }

      if(values?.length) {
        result['foundational_data_mapping'].push({
          foundational_data_type_id, values, restrict_value
        });
      }
    });

    if(!result['foundational_data_mapping']?.length) {
      delete result['foundational_data_mapping'];
    }

    return errorMessage?errorMessage:result;
  }

  private apiChangeObservable(url: string, payLoad: any): Observable <any> {
    if(this.isCreateMode) {
      return this.programService.post(url, payLoad);
    }

    url += `/${this.itemId}`;
    return this.programService.put(url, payLoad);
  }

  private queueOwnerEntry(entry: any) {
    let destroySub$: Subject <void> = new Subject <void> ();
    interval(200)
    .pipe(takeUntil(destroySub$))
    .subscribe(() => {
      if(this.ownerLoading === false) {
        destroySub$.next();
        this.ownerList = [...this.ownerList, entry];
        setTimeout(() => {
          this.ownerList.pop();
        }, 800);
      }
    });
  }

  private initializeSecondaryFields() {

    let {
      dependent_foundational_data_types = [],
    } = this.masterDetails;

    if(Array.isArray(dependent_foundational_data_types)) {
      dependent_foundational_data_types.forEach((entry: any) => {
        
        let entity: SecondaryFieldConfig = {
          id: entry?.id,
          name: entry?.name,
          slug: entry?.slug,
          subject: new Subject <Query> (),
          restrict_values: false,
          loading: false,
          prevQuery: null,
          totalRecords: 0,
          fields: []
        };

        this.depended_fields.push(entity);
        this.initializeDependedFieldsSub(entity);
        entity?.subject?.next({ page: 1, term: '' });
      })

      this.dependentFieldsConstructed = true;
    }
  }

  private dependentFieldsConstructed: boolean = false;
  private initializeDependedFields() {
    let destroySub$: Subject <void> = new Subject <void> ();
    interval(800)
    .pipe(takeUntil(destroySub$))
    .subscribe(() => {

      let allFieldsOptionsLoaded: boolean = this.depended_fields.every((field: SecondaryFieldConfig) => (field.loading === false));
      if(this.dependentFieldsLoaded && allFieldsOptionsLoaded) {
        destroySub$.next();

        const fd_mapping: Array <any> = this.itemDetails?.foundational_data_mapping || [];
        this.depended_fields.forEach((field: SecondaryFieldConfig) => {

          const id: string = field?.id;
          let itemFields: Array <ModalItemConfig> = field.fields;

          let fdEntry: any = fd_mapping.find((data: any) => (data?.foundational_data_type_id === id));
          if(fdEntry) {
            let { defaults = [], values = [], restrict_values = false } = fdEntry;
            field.restrict_values = restrict_values;
            if(Array.isArray(values)) {
              // Append entries in Depended fields if not present
              let recievedValues: Array <string> = values.map((val: any) => val?.id);
              itemFields = itemFields.filter((data: ModalItemConfig) => !recievedValues.includes(data?.value));
              itemFields.push(
                ...values.map((data: any) => {
                  return {
                    name: this.showMasterCodesOnly?data?.code:(`${data?.name} (${data?.code})`),
                    value: data?.id,
                    is_default: defaults?.includes(data?.id),
                    is_editable: data?.is_editable,
                    is_selected: true
                  }
                })
              );

              field.fields = itemFields;
            }
          }
        });
      }
    });
  }

  private initializeDependedFieldsSub(entity: SecondaryFieldConfig) {
    this.subscriptions.push(
      entity?.subject?.pipe(
        debounceTime(600),
        distinctUntilChanged((prev: Query, next: Query) => {
          return (
            (prev?.term === next?.term) &&
            (prev?.page === next?.page)
          );
        }), switchMap((query: Query) => {

          entity['prevQuery'] = query;
          let { term = '', page = 1 } = query;
          let url: string = `/configurator/programs/${this.programId}/foundational-data-types/${entity?.id}/foundational-data?page=${page}`;
          if (term) {
            url += `&name=${term}`;
          }

          entity['loading'] = true;
          return forkJoin([this.programService.get(url), of(page)]);
        })
      ).subscribe({
        next: (result: any) => {
          if(Array.isArray(result)) {

            let res: any = result?.[0];
            let page: number = result?.[1];

            entity['totalRecords'] = res?.total_records;
            if('foundational_data' in res) {
              res = res?.foundational_data;
            }

            if(Array.isArray(res)) {
              let results: Array <ModalItemConfig> = res.map((entry: any) => {
                return {
                  name: this.showMasterCodesOnly?entry?.code:(`${entry?.name} (${entry?.code})`),
                  value: entry?.id
                }
              });

              if(page === 1) {
                entity['fields'] = results;
              } else {
                entity['fields'] = [
                  ...entity['fields'],
                  ...results
                ];
              }
            }

            entity['loading'] = false;
          }
        }, error: (err: any) => {
          console.error(err);
          entity['loading'] = false;
          this.alert.error(`Error encountered while fetching entries for ${entity?.name}`);
        }
      })
    );
  }

  get pageTitle(): string {
    if(this.isCreateMode) {
      return `Add New ${this.masterName?'('+this.masterName+')':'Value'}`;
    }

    return `Edit ${this.masterName?'('+this.masterName+')':'Master Data'}`;
  }

  get isEditMode(): boolean {
    return !!this.itemId;
  }

  get isCreateMode(): boolean {
    return !this.itemId;
  }

  get programId(): string {
    return this.storage.get(StorageKeys.PROGRAM_ID);
  }

  get showMasterCodesOnly() {
    let config: any = this.storage.get(StorageKeys.CURRENT_PROGRAM)?.config;
    return !!config?.show_only_master_codes;
  }

  get showOwner() {
    if(!this.masterDetails) {
      return false;
    }

    return (this.masterDetails?.configuration?.track_owner === 'true');
  }

  get ownerMandatory() {
    if(!this.masterDetails) {
      return false;
    }

    return this.showOwner && (this.masterDetails?.configuration?.require_owner === 'true');
  }

  get dependentFieldsLoaded() {
    if(this.dependentFieldsConstructed) {
      return this.depended_fields.reduce((prev: boolean, entry: SecondaryFieldConfig) => {
        return (prev && !entry?.loading)
      }, true);
    }

    return false;
  }

  get userType() {
    return (this.storage.get(StorageKeys.USER_TYPE) || '')?.toUpperCase();
  }

  get allowedMDTuserType() {
    return true;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub?.unsubscribe());
  }
}

interface SecondaryFieldConfig {
  id: string;
  name: string;
  slug: string;
  subject?: Subject <any>;
  loading?: boolean;
  totalRecords?: number;
  prevQuery?: Query;
  fields: Array <ModalItemConfig>;
  restrict_values?: boolean;
};
