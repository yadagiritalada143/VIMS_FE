import { Component, OnInit, Input, OnDestroy, Output, EventEmitter } from '@angular/core';
import { EventStreamService, Events, EmitEvent } from 'src/app/core/services/event-stream.service';
import { Validators, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { ProgramService } from 'src/app/programs/program.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ProgramConfig } from '../../../shared/enums';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from '../../../shared/util/error-handler';
import { forkJoin, of, Subject, Subscription } from 'rxjs';
import { concatMap, debounceTime } from 'rxjs/operators';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { UniqueKeyPipe } from 'src/app/shared/pipe/unique-key.pipe';
import { Router } from '@angular/router';

type ListNode = { id: string, name: string, dependent_foundational_data_types?: Array <any> };

@Component({
  selector: 'app-create-foundational-data-type',
  templateUrl: './create-foundational-data-type.component.html',
  styleUrls: ['./create-foundational-data-type.component.scss']
})
export class CreateFoundationalDataTypeComponent implements OnInit, OnDestroy {

  // public isCreateCustomFields: any = 'hidden';
  public editClicked: any = false;
  public selectedFieldsId: any = '';
  public moduleName: any = null;

  @Input() title: string;
  @Input() icon: string;
  @Input() type: string;

  @Input() visibility = 'hidden';
  @Output() toggleVisibility: EventEmitter <any> = new EventEmitter <any> ();

  public isEditMode: boolean = false;
  public isViewMode: boolean = false;
  public addFoundationDataTypeForm: UntypedFormGroup;
  public tabIndex: number = 0;
  public toggle = {
    title: 'active',
    value: true
  }

  private subscriptions: Subscription[] = [];
  private isUpdateReq: boolean = false;
  private toUpdateId: string = null;
  private masterDataSub: Subject <any> = new Subject <any> ();
  private masterDataUpdateMap: Map <string, boolean> = new Map <string, boolean> ();
  private masterDataUpdateSet: Set <string> = new Set <string> ();

  private prevMasterDataConfig: any = null;
  private masterRecords: number = 20;

  public is_enabled_at_hierarchy: string = "";
  public buttonLabel: string = "Save";
  public excludeUserAssociation: boolean = false;
  public requireOwner: boolean = false;
  public trackOwner: boolean = true;
  public financialMDT: boolean = false;
  public allowMultipleDefaults: boolean = false;
  public viewOnlyMode: boolean = false;
  public masterDataTypeList: Array <ListNode> = [];
  public masterDataTypeLoading: boolean = false;
  public allowedFields: Array <string> = ['DROPDOWN', 'MULTI_SELECT_DROPDOWN'];

  constructor (
    private eventStream: EventStreamService,
    private fb: UntypedFormBuilder,
    private _programService: ProgramService,
    private storageService: StorageService,
    private _alertService: AlertService,
    private router: SvmsRouterService,
    private sortHelper: SortHelperPipe,
    private uniquePipe: UniqueKeyPipe,
    private route: Router
  ) { }

  ngOnInit(): void {

    this.addFoundationDataTypeForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      is_enabled: [true, Validators.required],
      job_mngmt: ['OPTIONAL', Validators.required],
      sow: ['OPTIONAL', Validators.required],
      master_data_type: [[]],
    });

    //Edit Foundational Data Type
    this.subscriptions.push(
      this.eventStream.on(Events.FOUNDATIONAL_DATA_TYPE_EDIT)
        .subscribe((data:any) => {
          if (data.event) {

            if("user_association_exclude" in data.data) {
              this.excludeUserAssociation = data.data["user_association_exclude"];
            }

            if("dependent_foundational_data_types" in data.data) {
              let values: Array <string> = this.appendMapEntries(data.data["dependent_foundational_data_types"], this.masterDataUpdateMap, this.masterDataUpdateSet);
              this.addFoundationDataTypeForm.get('master_data_type').setValue(values);
              values.forEach((id: string) => {
                const entry: any = this.masterDataTypeList.find((entry: any) => { return entry?.id === id });
                if(!entry) {
                  this.amendMasterDataType(id);
                }
              });
            }

            const { configuration } = data.data;
            if (configuration) {

              this.is_enabled_at_hierarchy = configuration.is_enabled_at_hierarchy;
              const {
                view_only,
                allow_multiple_default_values,
                require_owner,
                financial_master_data_type,
                track_owner
              } = data.data?.configuration;


              if (view_only && view_only.toLowerCase() === 'true') {
                this.viewOnlyMode = true;
              }

              if (allow_multiple_default_values && allow_multiple_default_values.toLowerCase() === 'true') {
                this.allowMultipleDefaults = true;
              }

              if (require_owner && require_owner.toLowerCase() === 'true') {
                this.requireOwner = true;
              }

              if(financial_master_data_type && financial_master_data_type?.toLowerCase() === 'true') {
                this.financialMDT = true;
              }

              if (track_owner && track_owner.toLowerCase() === 'false') {
                this.trackOwner = false;
              }
            }

            this.title = `Edit ${data.data.name}`;
            this.isEditMode = true;
            this.addFoundationDataTypeForm.patchValue(data.data);
            this.addFoundationDataTypeForm.get('job_mngmt').setValue(data.data.configuration.module_jobs);
            this.addFoundationDataTypeForm.get('sow').setValue(data.data.configuration.module_sow);
            this.toggle.value = data.data.is_enabled;
            this.toggle.title = data.data.is_enabled == true ? 'active' : 'inactive';
            this.isUpdateReq = true;
            this.toUpdateId = data.data.id;
            this.buttonLabel = "Update";
            this.isViewMode = false;
            this.masterDataSub.next({ term: '' });
          }
        }
      )
    );

    // Foundational data type view via details button
    this.subscriptions.push(this.eventStream.on(Events.FOUNDATIONAL_DATA_TYPE_VIEW).subscribe((data:any) => {
      if (data.event) {

        if("user_association_exclude" in data.data) {
          this.excludeUserAssociation = data.data["user_association_exclude"];
        }

        if("dependent_foundational_data_types" in data.data) {
          let values: Array <string> = this.appendMapEntries(data.data["dependent_foundational_data_types"], this.masterDataUpdateMap, this.masterDataUpdateSet);
          this.addFoundationDataTypeForm.get('master_data_type').setValue(values);
          values.forEach((id: string) => {
            const entry: any = this.masterDataTypeList.find((entry: any) => { return entry?.id === id });
            if(!entry) {
              this.amendMasterDataType(id);
            }
          });
        }

        const { configuration } = data.data;
        if (configuration) {

          const {
            view_only,
            allow_multiple_default_values,
            financial_master_data_type,
            require_owner,
            track_owner
          } = data.data?.configuration;

          if (view_only && view_only?.toLowerCase() === 'true')
            this.viewOnlyMode = true;

          if (allow_multiple_default_values && allow_multiple_default_values.toLowerCase() === 'true')
            this.allowMultipleDefaults = true;

          if (require_owner && require_owner.toLowerCase() === 'true') {
            this.requireOwner = true;
          }

          if(financial_master_data_type && financial_master_data_type?.toLowerCase() === 'true') {
            this.financialMDT = true;
          }

          if (track_owner && track_owner.toLowerCase() === 'false') {
            this.trackOwner = false;
          }
        }

          this.title = `${data.data.name} detail view`;
          this.addFoundationDataTypeForm.patchValue(data.data);
          this.addFoundationDataTypeForm.get('job_mngmt').setValue(data.data.configuration.module_jobs);
          this.addFoundationDataTypeForm.get('sow').setValue(data.data.configuration.module_sow);
          this.toggle.value = data.data.is_enabled;
          this.toggle.title = data.data.is_enabled == true ? 'active' : 'inactive';
          this.isEditMode = true;
          this.isViewMode = true;

        }
      })
    );

    this.fetchFoundationalDataTypes();
    this.masterDataSub.next({ term: '' });

  }

  onClickToggle() {
    if (this.toggle.value) {
      this.toggle.value = false;
      this.toggle.title = 'inactive';
    } else {
      this.toggle.value = true;
      this.toggle.title = 'active';
    }
    this.addFoundationDataTypeForm.get('is_enabled').setValue(this.toggle.value);
  }

  reflectToggle(action: string) {
    switch (action) {
      case 'allowMultipleDefaults':
        this.allowMultipleDefaults = !this.allowMultipleDefaults;
        break;
      case 'viewOnlyMode':
        this.viewOnlyMode = !this.viewOnlyMode;
        break;
      case 'excludeUserAssociation':
        this.excludeUserAssociation = !this.excludeUserAssociation;
        break;
      case 'requireOwner':
        this.requireOwner = !this.requireOwner;
        break;
      case 'trackOwner':
        this.trackOwner = !this.trackOwner;
        break;
      case 'financialMDT':
        this.financialMDT = !this.financialMDT;
        break;
    }
  }

  setCheckboxValue(ev) {
    if (ev) {
      let selected = ev.target.value;
      if (ev.target.name == 'jobMgt') {
        this.addFoundationDataTypeForm.get('job_mngmt').setValue(selected);
      } else if (ev.target.name == 'sow') {
        this.addFoundationDataTypeForm.get('sow').setValue(selected);
      }
    }
  }

  sidebarClose() {
    this.isUpdateReq = false;
    this.viewOnlyMode = false;
    this.allowMultipleDefaults = false;
    this.toggleVisibility.emit('hidden');
    this.title = `Add Master data Type`;
    this.buttonLabel = "Save";
    this.addFoundationDataTypeForm.reset();
    this.excludeUserAssociation = false;
    this.requireOwner = false;
    this.masterDataUpdateMap.clear();
    this.masterDataUpdateSet.clear();
    this.addFoundationDataTypeForm.patchValue({
      job_mngmt: 'OPTIONAL',
      sow: 'OPTIONAL',
      is_enabled: this.toggle.value,
      master_data_type: [],
    });
    this.toggle.value = true;
    this.toggle.title = 'active';
    this.isEditMode = false;
    this.isViewMode = false;
    if(this.route.url.includes('self-configuration')) {
      this.router.navigate(['program', 'master-data-type', 'list']);
    } else {
      this.router.navigate(['hierarchy', 'list']);
    }
  }

  saveFoundationalDataType() {

    const programDetails = JSON.parse(this.storageService.get(ProgramConfig[0]));
    const programId = programDetails['program_req_id'];
    const addDataTypeForm = this.addFoundationDataTypeForm.value;
    let payLoad = {
      name: addDataTypeForm.name,
      description: addDataTypeForm.description ? addDataTypeForm.description : '',
      is_enabled: addDataTypeForm.is_enabled == true,
      user_association_exclude: this.excludeUserAssociation,
      configuration: {
        hierarchy_included: 'OPTIONAL',
        module_jobs: addDataTypeForm.job_mngmt,
        module_sow: addDataTypeForm.sow,
        allow_multiple_default_values: this.allowMultipleDefaults ? 'true' : 'false',
        view_only: this.viewOnlyMode ? 'true' : 'false',
        require_owner: this.requireOwner ? 'true' : 'false',
        track_owner: this.trackOwner? 'true': 'false',
        financial_master_data_type: this.financialMDT? 'true': 'false'
      },
      dependent_foundational_data_types: [],
    }

    if (this.addFoundationDataTypeForm.valid) {
      if (addDataTypeForm.job_mngmt == 'OFF' && addDataTypeForm.sow == 'OFF') {
        this._alertService.error('At least one option should be selected as Optional or Required.');
        return false
      } else {
        if (this.isUpdateReq) {

          if (this.is_enabled_at_hierarchy) {
            payLoad.configuration['is_enabled_at_hierarchy'] = this.is_enabled_at_hierarchy
          }

          payLoad.dependent_foundational_data_types = this.appendMappedEntriesToPayload(this.masterDataUpdateMap, this.masterDataUpdateSet);
          if(!payLoad.dependent_foundational_data_types.length)
            delete payLoad.dependent_foundational_data_types;

          const url = `/configurator/programs/${programId}/foundational-data-types/${this.toUpdateId}`;
          this.subscriptions.push(
            this._programService.put(url, payLoad)
              .subscribe((data:any) => {
                if (data) {
                  this.is_enabled_at_hierarchy = "";
                  this._alertService.success('Master data Type Updated Successfully..');
                  this.sidebarClose();
                  this.eventStream.emit(new EmitEvent(Events.FOUNDATION_DATA_TYPE_LIST, true));
                }
              }, err => {
                this._alertService.error(errorHandler(err));
              }
            )
          );

        } else {

          const fd_list: Array <any> = this.addFoundationDataTypeForm.get('master_data_type').value;
          if(Array.isArray(fd_list)) {
            payLoad.dependent_foundational_data_types = fd_list.map((id: string) => {
              return {[id]: true};
            });
          }

          if(!payLoad.dependent_foundational_data_types.length)
            delete payLoad.dependent_foundational_data_types;

          this.subscriptions.push(this._programService.post(`/configurator/programs/${programId}/foundational-data-types`, payLoad).subscribe(
            (data:any) => {
              if (data) {
                this._alertService.success(`You have saved Master data type successfully. If you would like to see the details, <a href="/hierarchy/list">click here</a>`);
                this.sidebarClose();
                payLoad['id'] = data.id;
                this.eventStream.emit(new EmitEvent(Events.FOUNDATION_DATA_TYPE_LIST, true));
              }
            },
            (err) => {
              this._alertService.error(errorHandler(err));
            }));
        }
      }
    } else {
      this.addFoundationDataTypeForm.markAllAsTouched();
      this._alertService.error('Please fill the required fields.', {});
    }
  }

  fetchFoundationalDataTypes() {
    this.subscriptions.push(
      this.masterDataSub.pipe(
        debounceTime(600),
        concatMap((evt: any) => {

          let { term, page } = evt;
          if (!page)
            page = 1;

          if(this.prevMasterDataConfig?.term === term) {
            if(this.masterRecords <= this.masterDataTypeList.length) {
              return of(null);
            }
          }

          this.prevMasterDataConfig = { term, page };
          let programId = this.storageService.get(StorageKeys.PROGRAM_ID);
          // let url = `/configurator/programs/${programId}/foundational-data-types?limit=20&user_association_exclude=false`;
          // Changes with ticket Number V2M-3701
          let url = `/configurator/programs/${programId}/foundational-data-types?limit=20&active=true`;

          if (term)
            url += `&name=${term}`;

          if (page)
            url += `&page=${page}`;

          this.masterDataTypeLoading = true;
          return forkJoin([this._programService.get(url), of(page)]);

        })
      ).subscribe({
        next: (res: any) => {
          if (Array.isArray(res) && res.length) {

            let fd_types: Array<any> = res[0]?.foundational_data_types;
            let page: number = res[1];

            this.masterRecords = res[0]?.total_records;
            if (fd_types && Array.isArray(fd_types)) {

              let data: Array<any> = fd_types.map((fd_type: any) => {
                return {
                  name: fd_type?.name || 'Undefined',
                  id: fd_type?.id || '',
                  dependent_foundational_data_types: fd_type?.dependent_foundational_data_types || []
                }
              });

              if(page === 1) {
                this.masterDataTypeList = this.sortHelper.transform(data, 'name');
              } else {
                const results: Array <any> = [...this.masterDataTypeList, ...data];
                this.masterDataTypeList = this.uniquePipe.transform(results, 'id');
                this.masterDataTypeList = this.sortHelper.transform(this.masterDataTypeList, 'name');
              }

              this.masterDataTypeLoading = false;
              this.computeMDTExclusions();
            }
          }
        }, error: (err: any) => {
          this._alertService.error(errorHandler(err));
          this.masterDataTypeLoading = false;
        }
      })
    );
  }

  appendMappedEntriesToPayload(map: Map <string, boolean>, set: Set <string> = null) {
    let result: Array <any> = [];
    let keys = [...map.keys()];
    keys.forEach((key: string) => {
      if(set && (set.has(key)) || map.get(key))
        result.push({ [key]: map.get(key) });
    });

    return result;
  }

  appendMapEntries(objectMap: Array <any>, map: Map <string, boolean>, set: Set <string> = null) {

    let selections: Array <string> = [];
    objectMap.forEach((obj: any) => {

      const { id } = obj;
      selections.push(id);
      map.set(id, true);
      set.add(id);

      // let keys: Array <string> = Object.keys(obj);
      // keys.forEach((key: string) => {
      //   if(obj[key])
      //     selections.push(key);
      //   map.set(key, obj[key]);
      // });

    });

    return selections;
  };

  selectedValues(name: string, values: Array <string>) {
    this.addFoundationDataTypeForm.get(name).setValue(values);
    if(this.isUpdateReq) {
      switch(name) {
        case 'master_data_type':
          this.updateDataMapping(this.masterDataUpdateMap, values);
          break;
      }
    }
  }

  updateDataMapping(map: Map <string, boolean>, values: Array <string>) {

    let keys: Array <string> = [...map.keys()];
    keys.forEach((key: string) => {
      map.set(key, false);
    });

    values.forEach((value: string) => {
      map.set(value, true);
    });

  }

  searchTerm(name: string, term: string) {
    switch(name) {
      case 'master_data_type':
        this.masterDataSub.next({term});
        break;
    }
  }

  scrolledToEnd(name: string, evt: any) {
    switch (name) {
      case 'master_data_type':
        if (!this.masterDataTypeLoading && this.masterDataTypeList.length < this.masterRecords) {
          this.masterDataSub.next({
            ...this.prevMasterDataConfig,
            page: (this.prevMasterDataConfig?.page || 0) + 1
          });
        }
        break;
    }
  }

  amendMasterDataType(id: string) {
    let programId: string = this.storageService.get(StorageKeys.PROGRAM_ID);
    let url: string = `/configurator/programs/${programId}/foundational-data-types/${id}`;
    this._programService.get(url).subscribe((res: any) => {
      if(res) {

        if('foundational_data_type' in res) {
          res = res.foundational_data_type;
        }

        const { name, id, dependent_foundational_data_types = [] } = res;
        this.masterDataTypeList.push({name, id, dependent_foundational_data_types});
        this.masterDataTypeList = this.sortHelper.transform(this.masterDataTypeList, 'name');
        this.computeMDTExclusions();
      }
    });
  }

  // onClickCreateCustomFields(e) {
  //   this.isCreateCustomFields = 'visible';
  // }

  // onCloseCreateCustomFields(event) {
  //   this.isCreateCustomFields = 'hidden';
  //   this.editClicked = false;
  //   this.selectedFieldsId = '';
  //   this.customDataSub.next({ term: '', page: 1 });
  // }

  getForm(label: string) {
    return this.addFoundationDataTypeForm.get(label).value || [];
  }

  private excludedAssociations: Array <string> = [];
  private computeMDTExclusions() {
    if(Array.isArray(this.masterDataTypeList)) {

      let results: Array <string> = [this.toUpdateId];
      this.masterDataTypeList.forEach((entry: any) => {

        const id: string = entry?.id || '';
        const dependent_foundational_data_types: Array <string> = (entry?.dependent_foundational_data_types || []).map((type: any) => (type?.id || ''));
        
        // Exclude dependent foundational data types
        if(dependent_foundational_data_types.includes(this.toUpdateId)) {
          results.push(id);
        }
      });

      this.excludedAssociations = results;
    }
  }

  get allowedMasterDataTypes() {
    return this.masterDataTypeList.filter((entry: any) => !this.excludedAssociations.includes(entry?.id));
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
