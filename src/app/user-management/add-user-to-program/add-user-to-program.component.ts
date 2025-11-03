import { Component, EventEmitter, Input, OnInit, Output, OnChanges, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { UserService } from 'src/app/core/services/user.service';
import { ProgramService } from 'src/app/programs/program.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { ProgramConfig } from 'src/app/shared/enums';
import { FoundationalDataStore } from '../user-management.interfaces';
import { Subject, Subscription, of, forkJoin, Observable, interval } from 'rxjs';
import { debounceTime, filter, distinctUntilChanged, switchMap, concatMap, map, takeUntil } from 'rxjs/operators';
import { UniqueKeyPipe } from 'src/app/shared/pipe/unique-key.pipe';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import * as _ from 'lodash';
import { CustomFieldsComponent } from 'src/app/library/custom-fields/custom-fields/custom-fields.component';
import { CommonService } from 'src/app/library/custom-fields/common.service';
import { AllowedCFUserTypes } from '../profile-view/program-user-cf.config';

type Visibility = ('visible' | 'hidden');
@Component({
  selector: 'vms-add-user-to-program',
  templateUrl: './add-user-to-program.component.html',
  styleUrls: ['./add-user-to-program.component.scss']
})
export class AddUserToProgramComponent implements OnInit, OnChanges, OnDestroy {

  @ViewChild(CustomFieldsComponent) cfCmp: CustomFieldsComponent;

  @Input() type: 'program' | 'org';
  @Input() public list_or_create: boolean = false;

  public createUser: Visibility = 'visible';
  @Input('createUser') set visibilityToggler(data: Visibility) {
    this.createUser = data;
  }

  public isEditClicked: boolean = false;
  @Input('isEditClicked') setIsEditClicked(flag: boolean) {
    this.isEditClicked = !!flag;
  }

  public editData: any = null;
  public defaultFoundationalStore: Map <string, Array <any>> = new Map <string, Array <any>> ();
  public isRoleNotAvailable: boolean = false;
  @Input("editData") set setData(data) {
    if(data) {
      this.selectAllHierarchies = false;
      this.allWorkLocationsSelected = false;
    }

    this.editData = data;
    if (Array.isArray(this.editData?.defaults)) {
      this.editData.defaults.forEach((node: any) => {
        if (node.entity_type === 'FOUNDATIONAL_DATA') {

          const { entity_object, entity_id } = node;
          const { foundational_data_type } = entity_object;
          const { id } = foundational_data_type;

          const currValue = this.defaultFoundationalStore.get(id);
          if (!currValue) {
            this.defaultFoundationalStore.set(id, [entity_id]);
          } else {
            this.defaultFoundationalStore.set(id, [...currValue, entity_id]);
          }
        }
      });
    }
  };

  @Output() onClose: EventEmitter <Visibility> = new EventEmitter <Visibility> ();
  @Output() onAddDone: EventEmitter <number> = new EventEmitter <number> ();

  private ProgramSub: Subject <string> = new Subject <string> ();
  private UserSub: Subject <string> = new Subject <string> ();
  private VendorSub: Subject <string> = new Subject <string> ();

  public hierarchyList: Array <any> = [];
  public selections: Array <string> = [];
  public defaultSelections: Array <string> = [];
  public selectAllHierarchies: boolean = true;
  public hierarchyMap: Map <string, string> = new Map <string, string> ();
  public cfPopulationSubject: Subject <any> = new Subject <any> ();

  show_org: boolean = false;
  workLocationList: Array <any> = [];
  programs: Array <any> = [];
  roles: Array <any> = [];
  userType: string;
  id: string = '';
  orgId: string = '';
  program_id: string = '';
  program_profile_id: string = '';
  users: any;
  orgLists: Array <any> = [];
  selectedOrgType: string = '';
  selectedOrg: string = '';
  showVendorDD: boolean = false;
  vendorLists: Array <any>;
  selectedVendor: string = null;
  min_financial_limit: any = Number(0.0).toFixed(2);
  max_financial_limit: any = Number(0.0).toFixed(2);
  toggle: { title: string, value: boolean } = {
    title: 'Apply Unlimited Authority',
    value: false
  }

  currentProgram: any;
  orgDisabled: boolean = false;
  editDefaults: Array <any> = [];
  onAddOrgCategory: string = '';
  dynamicForm: UntypedFormArray = new UntypedFormArray([]);

  private subscriptions: Subscription[] = [];
  private fd_set: Set <string> = new Set <string> ();
  private fd_item_set: Set <string> = new Set <string> ();
  private roleSubject: Subject <string> = new Subject <string> ();
  private masterSubject: Subject <any> = new Subject <any> ();

  public totalLocationRecords: number = 0;
  public prevLocationSearch: { term: string, page: number, program: string } = { term: null, page: 1, program: null };
  public workLocationSubject: Subject <{ term: string, page: number }> = new Subject <{ term: string, page: number }> ();

  public AddtoProgramForm: UntypedFormGroup;
  public foundationalDataStore: Array <FoundationalDataStore> = [];
  private foundationalDataItemStore: Map <string, string> = new Map <string, string> ();
  public userRoleLoading: boolean = false;
  public vendorListLoading: boolean = false;
  public programListLoading: boolean = false;
  public usersLoading: boolean = false;
  public workLoading: boolean = true;
  public hierarchyLoading: boolean = true;
  private hierarchySub: Subject <string> = new Subject <string> ();

  public currentworkLocationTerm: string = null;
  public hierarchySearchTerm: string = null;

  public allWorkLocationsSelected: boolean = true;
  public defaultWorkLocation: string = null;
  public workLocationLabelMap: Map <string, string> = new Map <string, string> ();

  public customFieldsFormValid: boolean = true;
  public customFieldSelections: any = null;
  public receivedCFs: any = null;
  showProgram: boolean = true;

  constructor(
    private router: Router,
    private localStorage: StorageService,
    private programService: ProgramService,
    private userService: UserService,
    private fb: UntypedFormBuilder,
    private alert: AlertService,
    private loader: LoaderService,
    private route: ActivatedRoute,
    private uniquePipe: UniqueKeyPipe,
    private sortPipe: SortHelperPipe,
    private cfService: CommonService
  ) {

    this.subscriptions.push(
      this.roleSubject
      .pipe(
        debounceTime(1200)
      ).subscribe(term => {
        if (term) {
          this.roles = [];
          let program_ID;
          if (this.form.program.value === this.currentProgram?.name) {
            program_ID = this.currentProgram?.id;
          }
          else {
            program_ID = this.form.program.value;
          }
          this.getRoleList(program_ID, term);
        }
      })
    );

    this.subscriptions.push(
      this.workLocationSubject
        .pipe(
          debounceTime(600),
          map(({ term, page }) => {

            let program_ID: string = null;
            if (this.form.program.value === this.currentProgram?.id) {
              program_ID = this.currentProgram?.id;
            } else {
              program_ID = this.form.program.value;
            }

            return ({ term, page, program: program_ID });
          }),
          distinctUntilChanged((prevQuery: any, currQuery: any) => {
            return (
              (prevQuery?.program === currQuery?.program) &&
              (prevQuery?.term === currQuery?.term) &&
              (prevQuery?.page === currQuery?.page) &&
              !!this.workLocationList.length
            );
          }),
          concatMap(({ term, page, program }) => {
            return forkJoin([
              this.getWorkLocationObservable(program, term, page),
              of(page)
            ]);
          })
        ).subscribe((response: any) => {

          if (Array.isArray(response) && response.length >= 2) {

            const data: any = response?.[0];
            const page: number = response?.[1];

            if(data && page) {
            this.totalLocationRecords = data.total_records;
            let locations: Array <any> = data.work_locations?.map(work => {
              this.workLocationLabelMap.set(work?.id, `${work?.name} (${work?.code})`);
              return ({ id: work?.id, name: work?.name, code: work?.code });
            });
            if (page === 1) {
              this.workLocationList = locations;
            } else {
              locations = [...this.workLocationList, ...locations];
              this.workLocationList = this.uniquePipe.transform(locations, 'id');
            }

            this.workLocationList = this.sortPipe.transform(this.workLocationList, 'name');
            this.workLoading = false;
          }
          }
        }, (err: any) => {
          this.workLoading = false;
          this.alert.error(errorHandler(err));
        })
    );

    this.subscriptions.push(
    this.foundationalSearchSub
      .pipe(
        distinctUntilChanged((x: any, y: any) => {
          return (x.term === y.term) && (x.index === y.index);
        }),
        debounceTime(600),
        switchMap((res: any) => {

          const { term, index } = res;
          const programId = this.localStorage.get(StorageKeys.PROGRAM_ID);
          const fd_data: any = this.foundationalDataStore[index].id;

          let url = `/configurator/programs/${programId}/foundational-data-types/${fd_data}/foundational-data?limit=10&active=true&page=1`;
          if (term)
            url += `&k=${term}`;

          this.foundationalDataStore[index].loading = true;
          return forkJoin([of({ event: res }), this.userService.get(url)]);
        })
      ).subscribe(res => {
        if (res) {

          const event: any = res[0].event;
          const { term, index } = event;

          let result: any = res[1];
          let total_records = result.total_records;
          const fdType: FoundationalDataStore = this.foundationalDataStore[index];

          // Update store state
          fdType.loading = false;
          fdType.searchTerm = term;
          fdType.current_page = 2;

          // Keep selected records under list
          if (Array.isArray(fdType.selected)) {
            fdType.options = fdType.options.filter((entry: any) => fdType.selected.includes(entry.id));
          } else {
            fdType.options = fdType.options.filter((entry: any) => entry.id === fdType.selected);
          }

          // Update foundationalStore
          if ("foundational_data" in result) {
            result = result.foundational_data;
          }

          let oldResults = fdType.options;
          let newResults = result.map(node => {
            this.foundationalDataItemStore.set(node.id, node.name + ' (' + node.code + ')');
            return { id: node.id, name: node.name, code: node.code };
          });

          fdType.options = this.uniquePipe.transform([...oldResults, ...newResults], 'id');
          fdType.options = this.sortPipe.transform(fdType.options, 'name');
          fdType.total_records = total_records;

        }
      }, (err: any) => {
        console.error(err);
        this.alert.error('Error encountered while fetching entries for searched Master Data');
        this.foundationalDataStore.forEach(entry => {
          entry.loading = false;
        })
      })
    );

    this.subscriptions.push(
      this.masterSubject.pipe(
        debounceTime(600),
        concatMap(({ id, page, it }) => {

          if ((this.foundationalDataStore[it].total_records) <= (this.foundationalDataStore[it].options.length))
            return of(null);

          const fdType: FoundationalDataStore = this.foundationalDataStore[it];
          fdType.loading = true;

          let url = `/configurator/programs/${this.program_id}/foundational-data-types/${id}/foundational-data?active=true&limit=10&page=${page}`;
          if (fdType.searchTerm)
            url += `&k=${fdType.searchTerm}`;

          return forkJoin([
            this.userService.get(url),
            of(id), of(it)
          ]);
        })
      ).subscribe((data: any) => {
        if (Array.isArray(data) && data.length >= 3) {

          const res: any = data[0];
          const id: string = data[1];
          const it: number = data[2];
          const fdType: FoundationalDataStore = this.foundationalDataStore[it];

          fdType.loading = false;
          const { foundational_data, total_records } = res;
          this.foundationalDataStore.forEach((node, it) => {
            if (node.id === id) {

              this.foundationalDataStore[it].options = [
                ...this.foundationalDataStore[it].options,
                ...foundational_data.map(node => {
                  this.foundationalDataItemStore.set(node.id, `${node.name} (${node.code})`);
                  return {
                    name: node.name,
                    id: node.id,
                    code: node.code
                  }
                })
              ];

              this.foundationalDataStore[it].options = this.uniquePipe.transform(this.foundationalDataStore[it].options, 'id');
              this.foundationalDataStore[it].total_records = total_records;
              this.foundationalDataStore[it].current_page += 1;
            }
          });
        }
      }, (err: any) => {
        this.alert.error(errorHandler(err));
        this.foundationalDataStore.forEach((val: any, it: number) => {
          this.foundationalDataStore[it].loading = false;
        });
      })
    );

    this.subscriptions.push(
      this.cfPopulationSubject.pipe(
        debounceTime(1000)
      ).subscribe((data: any) => {
        setTimeout(() => {
          this.cfService.queueCFpopulation(data || {}, this.cfCmp).then((cfs: any) => {
            this.receivedCFs = cfs;
          });
        }, 0);
      })
    )
  }

  getRoleList(program_id: string, term: string = null) {

    if (this.createUser === 'hidden')
      return;

    this.form?.user_role.enable();
    if (this.profileProgramView || this.profileOrganizationView) {

      let orgType = this.localStorage.get(StorageKeys.PROFILE_ORG_CATEGORY);

      if (this.isEditClicked) {
        orgType = this.editData?.role?.organization_category;
      }

      if (orgType?.toLowerCase() == 'simplifyvms') {
        orgType = 'SUPER_ORG,SimplifyVMS';
      }

      this.userRoleLoading = true;
      let url = `/configurator/programs/${program_id}/roles?org_category=${orgType}&status=true`;
      if (term)
        url += `&k=${term}`;

      this.userService.get(url).subscribe({
        next: (data: any) => {
          if(Array.isArray(data?.roles)) {
            this.roles = this.sortPipe.transform(data?.roles, 'name');
            this.appendSelectedRole(program_id);
          }
          this.userRoleLoading = false;
        },
        error: (err: any) => {
          this.alert.error(errorHandler(err));
          this.userRoleLoading = false;
        }
      });
    }
    else {

      let orgType = this.selectedOrgType;
      if (this.isEditClicked) {
        orgType = this.editData?.role?.organization_category;
        const candidateOrWorkers: Array <string> = ['candidate', 'worker', 'workers'];
        if (candidateOrWorkers.includes(this.editData?.role?.organization_category?.toLowerCase())) {
          this.roles = [this.editData?.role];
          return;
        }
      }

      this.userRoleLoading = true;
      let url = `/configurator/programs/${program_id}/roles?org_category=${orgType}&status=true`;
      if (term) {
        url += `&k=${term}`;
      }

      this.userService.get(url)
        .subscribe({
          next: (data: any) => {
            this.roles = this.sortPipe.transform(data?.roles, 'name');
            this.appendSelectedRole(program_id);
            this.userRoleLoading = false;
          },
          error: (err: any) => {
            this.alert.error(errorHandler(err));
            this.userRoleLoading = false;
          }
        }
      );
    }
  }

  searchRoles(evt: any) {
    const { term } = evt;
    this.roleSubject.next(term);
  }

  searchWorkLocations(evt: any) {
    const { term } = evt;
    this.currentworkLocationTerm = term;
    this.workLocationSubject.next({ term, page: 1 });
  }

  showMoreLocations() {
    if (this.totalLocationRecords > this.workLocationList.length) {
      this.workLocationSubject.next({
        ...this.prevLocationSearch,
        page: this.prevLocationSearch?.page + 1
      });
    }
  }

  // Fetch individual role if not present in pagination API
  appendSelectedRole(program_id: string) {
    if (this.editData) {
      let selectedRole: string = this.AddtoProgramForm?.get('user_role')?.value || this.editData.role.id;
      let role_ids: Array <string> = this.roles.map(role => role?.id);
      if (!role_ids.includes(selectedRole)) {
        this.userRoleLoading = true;
        let url = `/configurator/programs/${program_id}/roles`;
        this.userService.get(url + `/${selectedRole}`)
          .subscribe({
            next: (res: any) => {
              this.userRoleLoading = false;
              if(Array.isArray(res?.role)) {
                this.roles = this.uniquePipe.transform([...this.roles, res?.role], 'id');
                this.roles = this.sortPipe.transform(this.roles, 'name');
              }
            },
            error: (err: any) => {
              this.alert.error(errorHandler(err));
              this.userRoleLoading = false;
            }
          }
        )
      }

      let availableRoles = this.roles.filter(f=>f.id == selectedRole)
      if(availableRoles.length > 0){
        this.isRoleNotAvailable = false
        this.form.user_role.setValue(selectedRole ? selectedRole : null);
      }else{
        this.isRoleNotAvailable = true
      }
    }
  }

  ngOnInit(): void {
    this.userType = this.localStorage.get(StorageKeys.USER_TYPE);
    this.selectedOrgType = this.userType;
    this.selectedOrg = this.localStorage.get(StorageKeys.ORGANIZATION_ID);
    this.orgId = this.localStorage.get(StorageKeys.ORGANIZATION_ID);
    this.program_id = this.localStorage.get(StorageKeys.PROGRAM_ID);
    this.id = this.route.snapshot.paramMap.get('id');
    this.currentProgram = this.localStorage.get(StorageKeys.CURRENT_PROGRAM);
    if (!this.localStorage.get(StorageKeys.PROFILE_ORG_CATEGORY)) {
      this.onAddOrgCategory = this.userType;
    }

    this.AddtoProgramForm = this.fb.group({
      client: new UntypedFormControl(null,),
      program: new UntypedFormControl(null,),
      user: new UntypedFormControl(null,),
      user_role: new UntypedFormControl(null, [Validators.required]),
      work_location: new UntypedFormControl([]),
      department: new UntypedFormControl(null),
      cost_center: new UntypedFormControl(null),
      company_code: new UntypedFormControl(null),
    });

    this.form.user_role.disable();
    if (this.userType !== 'SUPER_ORG' && this.userType !== 'MSP') {
      this.AddtoProgramForm?.get('client')?.clearValidators();
      this.getUsers(this.orgId);
    }

    if (this.userType === 'SUPER_ORG' || this.userType === 'MSP') {
      this.showSuperAdminConfig();
    }

    this.getProgramList();
    if (this.type === 'org') {
      this.orgId = this.localStorage.get(StorageKeys.PROFILE_ORG_ID);
      this.form.client.setValue(this.orgId);
      this.AddtoProgramForm?.get('user')?.clearValidators();
    } else if (this.type === 'program') {
      this.AddtoProgramForm?.get('program')?.clearValidators();
    }

    if (this.type === 'program') {
      this.getRoleList(this.program_id);
      if (this.isUserTypeClient()) {
        this.workLocationSubject.next({ term: '', page: 1 });
        this.getFoundationalDataTypes(this.program_id);
      }
    }

    if(this.router.url.includes('hideProgram')) {
      this.showProgram = false
      this.form.program.setValue(this.currentProgram?.id);
      this.getRoleList(this.currentProgram?.id)
    }

    if ((this.userType !== 'SUPER_ORG') && (this.userType !== 'MSP')) {
      this.getUsers(this.orgId);
    }

    this.subscriptions.push(
      this.ProgramSub
        .pipe(debounceTime(500))
        .subscribe(res => {
          this.getProgramList(res);
        })
    );

    this.subscriptions.push(
      this.UserSub
        .pipe(debounceTime(500))
        .subscribe(res => {
          this.getUsers(this.orgId, res);
        })
    );

    this.subscriptions.push(
      this.VendorSub
        .pipe(debounceTime(500))
        .subscribe(res => {
          this.getVendorLists(res);
        })
    );

    this.hierarchySub
      .pipe(
        filter(id => (id !== null)),
        debounceTime(500),
        switchMap((programId: string) => {

          if (this.createUser === 'hidden') {
            return of(null);
          }

          const url: string = `/configurator/programs/${programId}/hierarchy`;

          this.hierarchyLoading = true;
          return this.programService.get(url);
        })
      ).subscribe({
        next: (data: any) => {
          this.hierarchyLoading = false;
          if (data) {

            const hierarchyNode: Array <any> = data?.result?.[0]?.hierarchies;
            if (Array.isArray(hierarchyNode) && hierarchyNode.length) {
              this.hierarchyList = this.getPreorderHierarchyList(hierarchyNode);
              if(this.editData?.id) {
                this.selectEditItems();
              }
            }
          }
        }, error: (err: any) => {
          this.alert.error(errorHandler(err));
          this.hierarchyLoading = false;
        }
      }
    );

    if (this.isUserTypeClient() || this.isUserTypeMSP()) {
      this.hierarchySub.next(this.program_id);
    }
  }

  getPreorderHierarchyList(entries: Array <any>) {
    if(!entries) {
      return [];
    }

    let hierarchyList: Array <any> = [];
    if(Array.isArray(entries)) {
      entries.forEach((hierarchy: any) => {
        const { id, name, hierarchies, is_enabled } = hierarchy || {};

        this.hierarchyMap.set(id, name);
        if(is_enabled) {
          hierarchyList.push({ id, name, is_enabled });
        }

        hierarchyList.push(...this.getPreorderHierarchyList(hierarchies));
      })
    }

    return hierarchyList;
  }

  getFoundationalDataTypes(program_id: any) {

    if (this.createUser === 'hidden') {
      return;
    }

    const url = `/configurator/programs/${program_id}/foundational-data-types?active=true&user_association_exclude=false&ordering=ref_order`;
    this.userService
      .get(url)
      .toPromise()
      .then((res: any) => {
        const { foundational_data_types } = res;
        this.foundationalDataStore = foundational_data_types;
        this.foundationalDataStore = this.foundationalDataStore.map((node: any, it) => {

          let selected = null;
          let multiselect = false;
          const { configuration } = node;
          if (configuration) {
            const { allow_multiple_default_values } = configuration;
            multiselect = (allow_multiple_default_values && allow_multiple_default_values.toLowerCase() === 'true') ? true : false;
            if (multiselect) {
              selected = [];
            }
          }

          this.dynamicForm.push(new UntypedFormControl([]));
          if (this.editData !== null && this.editDefaults !== null) {
            this.editDefaults.forEach(fd => {
              if (fd.entity_type === 'FOUNDATIONAL_DATA') {
                if (fd?.entity_object?.foundational_data_type?.id === node.id) {
                  if (!multiselect) {
                    selected = fd.id;
                  } else {
                    if (fd?.id) {
                      selected.push(fd.id);
                    }
                  }
                }
              }
            });
          }

          return {
            id: node.id,
            name: node.name,
            options: [],
            selected,
            multiple: multiselect,
            current_page: 1,
            total_records: 0,
            loading: false,
            searchTerm: '',
          }
        }
        );
        this.foundationalDataStore.forEach((data: any, index: number) => {
          this.getFoundationaldataTypeItems(data?.id, program_id);
          this.foundationalDataStore[index].loading = true;
        });

      }, (err: any) => {
        this.alert.error(errorHandler(err));
      });

  }

  hotfixPatchForFoundationalData(program_id: any) {

    this.foundationalDataStore.forEach((node: FoundationalDataStore, it: number) => {

      const selectedValues = this.defaultFoundationalStore.get(node?.id?.toString());
      if (selectedValues) {
        if (!this.foundationalDataStore[it].multiple) {
          this.foundationalDataStore[it].selected = selectedValues[0];
        } else {
          this.foundationalDataStore[it].selected = selectedValues;
        }
      }

      if (this.foundationalDataStore[it].options) {

        let option_ids: Array <string> = this.foundationalDataStore[it].options.map(node => node?.id);
        if (selectedValues) {
          selectedValues.forEach((selection_id: string) => {
            if (!option_ids.includes(selection_id)) {
              this.fetchSpecificFDItemAndAppend(it, this.foundationalDataStore[it]?.id?.toString(), selection_id, program_id);
            };
          });
        }
      }
    });
  }

  fetchSpecificFDItemAndAppend(it: number, fd_type: string, fd_item: string, program_id: any) {

    if (this.fd_item_set.has(fd_item))
      return;
    else
      this.fd_item_set.add(fd_item);

    const fdEntry: FoundationalDataStore = this.foundationalDataStore[it];
    fdEntry.loading = true;

    const url = `/configurator/programs/${program_id}/foundational-data-types/${fd_type}/foundational-data/${fd_item}`;

    this.programService.get(url)
      .toPromise()
      .then((res: any) => {

        if ("foundational_data" in res) {
          res = res.foundational_data;
        }

        const { name, code } = res;
        const options = fdEntry.options;

        this.foundationalDataItemStore.set(fd_item, name + " (" + code + ")");
        fdEntry.options = this.sortPipe.transform([...options, {
          name: name,
          id: fd_item,
          code: code
        }], 'name');

        fdEntry.loading = false;

      }, (err: any) => {
        this.alert.error(errorHandler(err));
        fdEntry.loading = false;
      });

  }

  getFoundationaldataTypeItems(foundational_id: string, program_id: any) {

    let present = false;
    this.foundationalDataStore.forEach((node: any) => {
      if (node?.id === foundational_id) {
        if (node?.options?.length !== 0) {
          present = true;
          return;
        }
      }
    });

    if (present)
      return;

    if (this.fd_set.has(foundational_id))
      return;
    else
      this.fd_set.add(foundational_id);

    const url = `/configurator/programs/${program_id}/foundational-data-types/${foundational_id}/foundational-data?active=true&limit=10&page=1`;

    this.loader.show();
    this.userService.get(url)
      .toPromise()
      .then((res: any) => {

        const { foundational_data, total_records } = res;

        this.loader.hide();
        this.foundationalDataStore.forEach((node, it) => {
          if (node?.id === foundational_id) {

            this.foundationalDataStore[it].loading = false;
            this.foundationalDataStore[it].options = foundational_data
              .map(node => {
                this.foundationalDataItemStore.set(node?.id, `${node?.name} (${node?.code})`);
                return {
                  name: node?.name,
                  id: node?.id,
                  code: node?.code
                }
              });

            this.foundationalDataStore[it].options = this.sortPipe.transform(this.foundationalDataStore[it].options, 'name');
            this.foundationalDataStore[it].total_records = total_records;
            this.foundationalDataStore[it].current_page += 1;

            if (node?.multiple) {
              this.foundationalDataStore[it].selected = [];
            }

            if (this.editData !== null) {
              this.foundationalDataStore[it].options.forEach(p1 => {
                if (this.editDefaults !== null)
                  this.editDefaults.forEach(p2 => {
                    if (p1?.id === p2?.entity_id) {
                      if (!node.multiple)
                        this.foundationalDataStore[it].selected = p1?.id;
                      else {
                        let storeRef = this.foundationalDataStore[it];
                        storeRef.selected = [...storeRef.selected, p1?.id];
                      }
                    }
                  })
              })
            }

            this.hotfixPatchForFoundationalData(program_id);
          }
        })
      }, (err: any) => {
        this.loader.hide();
        console.error(errorHandler(err));
      }
    );
  }

  fetchFoundationalDataItem(it: number, evt: any) {
    this.foundationalDataStore[it].selected = evt;
  }

  // setting up super admin configurations
  showSuperAdminConfig() {
    if (!this.profileOrganizationView) {
      this.AddtoProgramForm?.get('client').clearValidators();
    }

    let _currentProgram = this.localStorage.get(StorageKeys.CURRENT_PROGRAM);

    let client, msp;
    if (_currentProgram) {
      client = _currentProgram?.client;
      msp = _currentProgram?.msp;
    }


    let data: Array <any> = [];

    if (client) {
      data.push({ id: client?.id, name: client?.name, type: 'CLIENT' });
    }

    if (msp?.id && msp?.name) {
      data.push({ id: msp?.id, name: msp?.name, type: 'MSP' });
    }

    this.show_org = true;
    this.orgLists = [...data, { id: 'vendor', name: 'Vendor', type: 'VENDOR' }];

    if (typeof msp == 'string') {
      const url: string = `/configurator/organizations/${msp}`;
      this.programService.get(url)
        .subscribe({
          next: (data_res: any) => {
            data.push({ id: data_res?.id, name: data_res?.name, type: 'MSP' })
            this.orgLists = [...this.orgLists, { id: data_res?.id, name: data_res?.name, type: 'MSP' }];
          },
          error: (err: any) => {
            this.alert.error(errorHandler(err));
          }
        }
      );
    }

    this.selectedOrg = data?.[0]?.id;
    if (!this.localStorage.get(StorageKeys.PROFILE_ORG_CATEGORY)) {
      this.onAddOrgCategory = data?.[0]?.type;
    }

    this.orgId = this.selectedOrg;
    this.getUsers(this.selectedOrg);
    this.selectedOrgType = data?.[0]?.type;
  }

  // changing vendor if visible
  onChangeVendor() {
    this.orgId = this.selectedVendor;
    this.getUsers(this.orgId);
  }

  // selecting an organization
  onChangeOrg(evt) {

    let selectedOrg = this.selectedOrg;
    let selectedType = this.orgLists.find((elm: any) => (elm?.id === selectedOrg));
    this.selectedOrgType = selectedType?.type;
    this.onAddOrgCategory = this.selectedOrgType;
    if (selectedOrg === 'vendor') {
      this.users = [];
      this.orgId = '';
      this.showVendorDD = true;
      this.getVendorLists();
    } else {
      this.orgId = evt;
      this.showVendorDD = false;
      this.getUsers(this.orgId);
    }

    this.form.user.setValue(null);
    this.form.user_role.setValue(null);
    this.getRoleList(this.program_id);

    if (this.isUserTypeClient() || this.isUserTypeMSP()) {
      this.hierarchySub.next(this.program_id);
      this.selectAllHierarchies = true;
      this.defaultSelections = [];
    }

    if (this.isUserTypeClient()) {
      this.workLocationSubject.next({ term: '', page: 1 });
      this.allWorkLocationsSelected = true;
      this.defaultWorkLocation = null;
      this.getFoundationalDataTypes(this.program_id);
    }
  }

  // getting vendors List  if organization selected is Vendor
  getVendorLists(term: string = null) {
    if (this.createUser === 'hidden') {
      return;
    }

    let programDetails = JSON.parse(this.localStorage.get(ProgramConfig[0]));
    let programId = programDetails.program_req_id;
    let url = `/configurator/programs/${programId}/vendors`;
    if (term) {
      url += `?name=${term}`;
    }

    this.vendorListLoading = true;
    this.userService.get(url)
      .subscribe({
        next: (data: any) => {
          this.vendorListLoading = false;
          const { program_vendors = [] } = data || {};
          if (Array.isArray(program_vendors)) {
            this.vendorLists = program_vendors.map(elm => ({ ...(elm?.vendor || []) }));
          }
        }, error: (err: any) => {
          this.vendorListLoading = false;
          this.alert.error(errorHandler(err));
        }
      }
    );
  }

  // OnChange of editData
  ngOnChanges() {
    if (this.editData?.id) {

      this.cfPopulationSubject.next(this.editData?.program_user_custom_fields);

      this.editDefaults = this.editData?.defaults;
      this.selectedOrg = this.editData?.name;
      this.selectedOrgType = this.editData?.role?.organization_category;
      this.onAddOrgCategory = this.editData?.role?.organization_category;
      this.isEditClicked = true;

      this.toggle.value = this.editData?.financial_approval_authority?.is_financial_authority_unlimited;

      if (this.editData?.financial_approval_authority?.min_amount_limit === 0) {
        this.min_financial_limit = Number(0.0).toFixed(2);
      }
      else {
        this.min_financial_limit = Number(this.editData?.financial_approval_authority?.min_amount_limit).toFixed(2);
      }
      if (this.editData?.financial_approval_authority?.amount_limit === 0) {
        this.max_financial_limit = Number(0.0).toFixed(2);
      }
      else {
        this.max_financial_limit = Number(this.editData?.financial_approval_authority?.amount_limit).toFixed(2);
      }

      if (this.profileOrganizationView || this.profileProgramView) {
        let program = this.programs.find((node: any) => (node?.id === this.editData?.id));
        if (!program) {
          this.programs.push({ 'program_id': this.editData?.id, 'name': this.editData?.name });
        }

        this.form.program.setValue(this.editData?.id ? this.editData?.id : null);
        this.program_profile_id = this.editData?.id;
        this.getRoleList(this.editData?.id);

        if (this.isUserTypeClient() || this.isUserTypeMSP()) {
          this.hierarchySub.next(this.editData?.id);
        }
        if (this.isUserTypeClient()) {
          this.workLocationSubject.next({ term: '', page: 1 });
          this.getFoundationalDataTypes(this.editData?.id);
        }
      } else {

        this.form.program.setValue(this.program_id);
        this.getRoleList(this.program_id);
        if (this.isUserTypeClient() || this.isUserTypeMSP()) {
          this.hierarchySub.next(this.program_id);
        }

        if (this.isUserTypeClient()) {
          this.workLocationSubject.next({ term: '', page: 1 });
          this.getFoundationalDataTypes(this.program_id);
        }
      }

      this.form.user.setValue(this.editData?.full_name ? this.editData?.full_name : null);
      //this.form.user_role.setValue(this.editData?.role?.id ? this.editData?.role?.id : null);

      this.initializeLocationsAfterLoad();

    } else {
      this.AddtoProgramForm?.reset();
      this.orgDisabled = false;
      this.isEditClicked = false;
      this.form?.client.enable();
      this.form?.user.enable();
      this.selectedOrgType = this.userType;
      this.selectedOrg = this.localStorage.get(StorageKeys.ORGANIZATION_ID);
      this.orgId = this.localStorage.get(StorageKeys.ORGANIZATION_ID);
      if (this.userType === 'SUPER_ORG' || this.userType === 'MSP') {
        if (!this.profileProgramView && !this.profileOrganizationView) {
          this.showSuperAdminConfig();
        }
      }
      else {
        if (!this.profileOrganizationView && !this.profileProgramView) {
          this.getUsers(this.orgId);
        }
      }

      if (this.profileOrganizationView || this.profileProgramView) {
        this.selectedOrgType = this.localStorage.get(StorageKeys.PROFILE_ORG_CATEGORY);
        this.orgId = this.localStorage.get(StorageKeys.PROFILE_ORG_ID);
        this.selectedOrg = this.orgId;
        this.onAddOrgCategory = this.selectedOrgType;
        if (this.selectedOrgType?.toLowerCase() === 'client') {
          this.onAddOrgCategory = 'CLIENT';
          this.selectedOrgType = 'CLIENT';
        }
      }

      this.form?.program?.setValue(this.currentProgram?.id);
      if(!this.programs.find((program: any) => (program?.id === this.currentProgram?.id))) {
        this.programs.push({
          program_id: this.currentProgram?.id,
          name: this.currentProgram?.name || 'Undefined'
        })
      }

      if (this.currentProgram) {
        this.getRoleList(this.currentProgram?.id);
        if (this.isUserTypeClient() || this.isUserTypeMSP()) {
          this.hierarchySub.next(this.currentProgram?.id);
        }
        if (this.isUserTypeClient()) {
          this.workLocationSubject.next({ term: '', page: 1 });
          this.getFoundationalDataTypes(this.currentProgram?.id);
        }
      }
    }
  }

  selectEditItems() {

    if (this.isUserTypeClient() || this.isUserTypeMSP()) {

      // entry selection
      if(!!this.editData?.is_all_hierarchies) {
        this.selectAllHierarchies = true;
      } else {
        this.selections = this.editData.hierarchies.map((node: any) => node?.id);
      }

      // default selection
      const defaults = this.editData?.defaults;
      if (defaults) {
        this.defaultSelections = [];
        defaults.forEach(element => {
          if (element?.entity_type === 'HIERARCHY')
            this.defaultSelections = element?.entity_id;
        });
      }
    }
  }

  getWorkLocationObservable(programId: string, term: string = "", page: number = 1): Observable <any> {

    if (this.prevLocationSearch?.program !== programId) {
      this.workLocationList = [];
      this.workLocationLabelMap.clear();
    }

    this.prevLocationSearch = { term, page, program: programId };
    if (this.createUser === 'hidden') {
      return of(null);
    }

    let url = `/configurator/programs/${programId}/work-locations?status=true&page=${page}`;
    if (term) {
      url += `&k=${this.currentworkLocationTerm}`;
    }

    this.workLoading = true;
    return this.programService.get(url);
  }

  // Getting program List for adding user through profile
  getProgramList(term: string = null) {
    let url = `/configurator/programs?source_user=SELF`;
    if (term) {
      url += `&k=${term}`;
    }

    this.programListLoading = true;
    this.programService.get(url)
      .subscribe({
        next: (data: any) => {
          this.programListLoading = false;
          this.form.program.disable();
          this.programs = (data?.programs || []).map(prog => ({ program_id: prog?.id, name: prog?.name }));
          this.programs = this.sortPipe.transform(this.programs, 'name');
          this.form.program.enable();
        }, error: (err: any) => {
          this.programListLoading = false;
          this.alert.error(errorHandler(err));
        }
      }
    );
  }

  // select program binding
  selectProgram(event: any) {
    this.form.user_role.setValue(null);
    this.form.work_location.setValue([]);
    this.selections = [];
    this.defaultSelections = null;
    this.defaultWorkLocation = null;
    this.allWorkLocationsSelected = false;
    this.selectAllHierarchies = false;

    this.getRoleList(event);
    if (this.isUserTypeClient() || this.isUserTypeMSP()) {
      this.hierarchySub.next(this.AddtoProgramForm?.value?.program);
    }
    if (this.isUserTypeClient()) {
      this.workLocationSubject.next({ term: '', page: 1 });
      this.getFoundationalDataTypes(this.AddtoProgramForm?.value?.program);
    }
  }

  // Select client binding
  selectClient() {
    this.form?.user?.setValue(null);
    this.getUsers(this.AddtoProgramForm?.value?.client);
  }

  onClickToggle() {
    if (this.toggle.value) {
      this.min_financial_limit = Number(0.0).toFixed(2);
      this.max_financial_limit = Number(0.0).toFixed(2);
      this.toggle.value = false;
    }
    else {
      this.min_financial_limit = Number(0.0).toFixed(2);
      this.max_financial_limit = 9999999999999.99;
      this.toggle.value = true;
    }
  }

  public foundationalSearchSub: Subject <{ index: number, term: string }> = new Subject <{ index: number, term: string }> ();
  searchFoundationalStore(it: number, search: any) {
    let term: string = search.term;
    this.foundationalSearchSub.next({ index: it, term });
  }

  // get users
  getUsers(orgId: any, term: string = null) {

    if (this.createUser === 'hidden') {
      return;
    }

    this.form?.user.enable();
    let programId = this.program_id;
    if (!this.profileOrganizationView && !this.profileProgramView) {
      programId = this.localStorage.get(StorageKeys.PROGRAM_ID);
    }

    let url = `/configurator/organizations/${orgId}/members?exclude_candidates=true&exclude_program=${programId}`;
    if (term) {
      url += `&k=${term}`;
    }

    this.usersLoading = true;
    this.userService.get(url)
      .subscribe({
        next: (data: any) => {
          this.usersLoading = false;
          if(Array.isArray(data?.members)) {
            this.users = this.sortPipe.transform(data.members, 'full_name');
          }
        }, error: (err: any) => {
          this.usersLoading = false;
          this.alert.error(errorHandler(err));
        }
      }
    );
  }

  // Called on Sidebar Closed
  sidebarClose() {

    this.createUser = 'hidden';
    this.onClose.emit('hidden');
    this.onCancel();

    this.showProgram = true
    this.dynamicForm = new UntypedFormArray([]);
    this.selections = [];
    this.defaultSelections = [];
    this.selectAllHierarchies = false;
    this.defaultFoundationalStore.clear();
    this.fd_set.clear();
    this.fd_item_set.clear();
    this.min_financial_limit = Number(0.0).toFixed(2);
    this.max_financial_limit = Number(0.0).toFixed(2);
    this.toggle.value = false;
    this.AddtoProgramForm?.reset();
    if (this.type === 'org') {
      this.form.user_role.disable();
    }

    this.selectedOrgType = this.userType;
    this.onAddOrgCategory = '';
    this.isEditClicked = false;
    this.orgDisabled = false;
    this.showVendorDD = false;
    this.selectedVendor = null;
  }

  onCancel(event = null) {
    event ? event?.preventDefault?.() : null;
    if (this.list_or_create) {
      this.createUser = 'hidden';
    } else {
      this.router.navigateByUrl('/user-management');
    }
  }

  searchProgram(name: any) {
    const { term } = name;
    this.ProgramSub.next(term);
  }

  searchUsers(name: any) {
    if (this.showVendorDD) {
      if (!this.selectedVendor) {
        this.alert.warn("Select a Vendor Organization First Before Searching a User");
        return;
      }
    }

    const { term } = name;
    this.UserSub.next(term);
  }

  searchVendor(name: any) {
    const { term } = name;
    this.VendorSub.next(term);
  }

  onSave() {

    if (this.onAddOrgCategory.toLowerCase() === 'client') {
      if (!this.toggle.value) {
        if (this.min_financial_limit > this.max_financial_limit) {
          this.alert.error("Min Value Can not be greater than Max Value");
          return;
        }
      }
    }

    if(!this.customFieldsFormValid) {
      this.alert.error("Please select all the required Custom Fields!");
      return;
    }

    let payload: any = {};
    let program_ID;
    if (this.form.program.value === this.currentProgram?.name) {
      program_ID = this.currentProgram?.id;
    }
    else {
      program_ID = this.form.program.value;
    }

    const hierarchies = this.isAllHierarchiesSelected ? this.hierarchyList.map((entry: any) => entry?.id) : this.selections;
    let worklocation_ids = null;
    if (this.form?.work_location?.value || this.allWorkLocationsSelected) {
      worklocation_ids = this.allWorkLocationsSelected ? ['ALL'] : (this.form?.work_location?.value || []);
    }

    let foundational_data: Array <string> = [];
    this.dynamicForm?.controls?.forEach((field: UntypedFormControl) => {
      const value = field?.value;
      if (value) {
        if (Array.isArray(value))
          foundational_data.push(...value);
        else
          foundational_data.push(value);
      }
    });

    payload = {
      hierarchies,
      is_all_hierarchies: this.isAllHierarchiesSelected,
      worklocation_ids,
      foundational_data,
      defaults: []
    };

    // Attach selected custom fields
    payload["user_custom_fields"] = this.cfService.amendCFData(this.customFieldSelections);

    // Hierarchy
    if(!hierarchies?.length) {
      payload['hierarchies'] = false;
    } else if (this.defaultSelections?.length) {
      payload.defaults = [
        {
          "entity_type": "HIERARCHY",
          "entity_id": this.defaultSelections,
        }
      ]
    }

    // Work Location
    if(!worklocation_ids?.length) {
      payload['worklocation_ids'] = false;
    } else if (this.defaultWorkLocation) {
      payload.defaults.push({
        "entity_type": "WORK_LOCATION",
        "entity_id": this.defaultWorkLocation
      });
    }

    if (typeof this.max_financial_limit === "string") {
      this.max_financial_limit = parseFloat(this.max_financial_limit);
    }

    if (typeof this.min_financial_limit === "string") {
      this.min_financial_limit = parseFloat(this.min_financial_limit);
    }

    if (this.onAddOrgCategory?.toLowerCase() === 'client') {
      payload.financial_approval_authority = {
        "amount_limit": this.max_financial_limit,
        "min_amount_limit": this.min_financial_limit,
        "is_financial_authority_unlimited": this.toggle.value
      }
    }

    if (Array.isArray(foundational_data)) {
      foundational_data.forEach((node: string) => {
        payload.defaults.push({
          "entity_type": "FOUNDATIONAL_DATA_TYPE",
          "entity_id": node
        });
      });
    }

    if (!foundational_data?.length) {
      delete payload['foundational_data'];
    }

    if (this.profileOrganizationView && !this.profileProgramView) {

      this.loader.show();
      const userId = this.id;
      const roleId = this.form?.user_role?.value;
      const org_id = this.orgId;

      if (this.editData !== null) {

        payload = {
          ...payload,
          role_id: roleId
        };

        this.updateMemberDetails(payload, userId);
        return;
      }

      this.loader.show();
      payload = {
        ...payload,
        program_id: program_ID,
        members: [
          {
            user_id: userId,
            role_id: roleId,
          },
        ],
      };

      if (!payload?.defaults?.length) {
        delete payload['defaults'];
      }

      this.userService.post(`/configurator/organizations/${org_id}/members/attach`, payload)
      .subscribe((data: any) => {
          this.alert.success(`You have successfully added a user to program`);
          this.loader.hide();
          this.onAddDone.emit();
          this.sidebarClose();
        },
        error => {
          this.loader.hide();
          this.alert.error(errorHandler(error));
        },
      );

    } else if (this.profileProgramView && !this.profileOrganizationView) {

      this.loader.show();
      const userId = this.id;
      const roleId = this.form?.user_role?.value;
      const org_id = this.orgId;
      if (this.editData !== null) {

        payload = {
          ...payload,
          role_id: roleId
        };

        this.updateMemberDetails(payload, userId);
        return;
      }

      this.loader.show();
      payload = {
        ...payload,
        program_id: program_ID,
        members: [
          {
            user_id: userId,
            role_id: roleId,
          },
        ],
      };

      this.userService.post(`/configurator/organizations/${org_id}/members/attach`, payload)
        .subscribe((data: any) => {
          this.alert.success(`You have successfully added a user to program`);
          this.loader.hide();
          this.sidebarClose();
          this.onAddDone.emit();
        },
        error => {
          this.loader.hide();
          this.alert.error(errorHandler(error));
        },
      );
    }

    // if adding from program users add Users button
    else if (window.location.href.includes('users/list')) {

      if (this.isEditClicked) {
        this.loader.show();
        let roleId: any;
        if (this.form?.user_role?.value === this.editData?.role?.name) {
          roleId = this.editData?.role?.id;
        } else {
          roleId = this.form?.user_role?.value;
        }

        payload = {
          ...payload,
          role_id: roleId
        };

        payload = this.payloadCorrection(payload);
        this.userService.put(`/configurator/programs/${this.program_id}/members/${this.editData?.id}`, payload)
          .subscribe((data: any) => {
            this.loader.hide();
            this.alert.success(`The role has been updated successfully`);
            this.onAddDone.emit();
            this.sidebarClose();
          },
          error => {
            this.loader.hide();
            this.alert.error(errorHandler(error));
          },
        );
      } else {

        const org_id = this.form?.client?.value ? this.form?.client?.value : this.orgId;
        const userId = this.form?.user?.value;
        const roleId = this.form?.user_role?.value;

        payload = {
          ...payload,
          program_id: this.program_id,
          members: [
            {
              user_id: userId,
              role_id: roleId,
            },
          ],
        };

        if (!payload?.members?.[0]?.user_id) {
          this.alert.error("Please Select User to Add to Program As It is a mandatory field");
          return;
        }

        this.loader.show();
        this.userService.post(`/configurator/organizations/${org_id}/members/attach`, payload)
        .subscribe((data: any) => {
            this.alert.success(`You have successfully added a user to program`);
            this.loader.hide();
            this.onAddDone.emit();
            this.sidebarClose();
          },
          error => {
            this.loader.hide();
            this.alert.error(errorHandler(error));
          },
        );
      }
    }
  }

  updateMemberDetails(payload: any, userId: string) {

    if (!("foundational_data" in payload)) {
      payload = {
        foundational_data: null,
        ...payload
      }
    }

    payload = this.payloadCorrection(payload);
    const url = `/configurator/programs/${this.program_profile_id}/members/${userId}`;
    this.loader.show();
    this.userService.put(url, payload)
      .toPromise()
      .then((res: any) => {
        this.loader.hide();
        this.alert.success('Program details updated successfully');
        this.onAddDone.emit();
        this.sidebarClose();
      }, (err: any) => {
        this.loader.hide();
        this.alert.error(errorHandler(err));
      }
    )
  }

  clearFoundationalData(it: number, item: string) {

    const formSelection: AbstractControl = this.dynamicForm?.controls?.[it];
    const value: any = formSelection?.value || [];

    if(Array.isArray(value)) {
      let finalSelections: Array <any> = value.filter((uid: string) => (uid !== item));
      formSelection?.setValue(finalSelections);
    }
  }

  showMore(id: string, page: number, it: number) {
    this.masterSubject.next({ id, page, it });
  }

  allWorkLocationToggled(flag: boolean) {
    this.allWorkLocationsSelected = flag;
    this.defaultWorkLocation = flag ? this.defaultWorkLocation : null;
    this.AddtoProgramForm.get('work_location')?.setValue([]);
  }

  allHierarchyToggled(flag: boolean) {
    this.selectAllHierarchies = flag;
    this.defaultSelections = flag ? this.defaultSelections : [];
    this.selections = [];
  }

  removeWorkLocation(id: string) {
    const workForm: AbstractControl = this.form?.work_location;
    workForm.setValue((workForm?.value || []).filter((locationId: string) => (locationId !== id)));
    if(this.defaultWorkLocation === id) {
      this.defaultWorkLocation = null;
    }
  }

  removeHierarchySelection(id: string) {
    this.selections = this.selections.filter((entry: string) => (entry !== id));
  }

  payloadCorrection(payload: any) {

    // removing duplicate entries recieved
    let fd_data: Array <string> = payload?.foundational_data || [];
    if (Array.isArray(fd_data)) {

      let unique_fd: Array <string> = [];
      fd_data.forEach((id: string) => {
        if (!unique_fd.includes(id)) {
          unique_fd.push(id);
        }
      });

      payload.foundational_data = unique_fd;
    }

    // remove defaults field if empty
    let defaults: Array <any> = payload?.defaults;
    if (Array.isArray(defaults) && !defaults?.length) {
      delete payload.defaults;
    }

    return payload;
  }

  initializeLocationsAfterLoad() {

    let $destroySub: Subject <void> = new Subject <void> ();
    interval(500).pipe(takeUntil($destroySub)).subscribe(() => {
      if(!this.workLoading) {

        const work_locations: Array <any> = this.editData?.work_locations;
        let locationIds: Array <string> = work_locations?.map((entry: any) => entry?.id);

        this.allWorkLocationsSelected = !!this.editData?.is_all_work_locations;
        if(!this.allWorkLocationsSelected) {
          this.form.work_location.setValue(locationIds);
        }

        // Amend entries to list
        this.workLocationList = this.sortPipe.transform(
          this.uniquePipe.transform([
            ...this.workLocationList, ...work_locations.map(({ id, name, code }) => {
              this.workLocationLabelMap.set(id, `${name} (${code})`);
              return { id, name, code };
            })
          ], 'id'), 'name');

        // Default Work location
        if(Array.isArray(this.editDefaults)) {
          let default_work_location: any = this.editDefaults.find(node => (node?.entity_type === "WORK_LOCATION"));
          if (default_work_location) {
            this.defaultWorkLocation = default_work_location?.entity_object?.id;
            if(!locationIds.includes(this.defaultWorkLocation)) {
              this.fetchLocationDetails(this.defaultWorkLocation);
            }
          }
        }

        $destroySub.next();
      }
    });
  }

  fetchLocationDetails(id: string) {
    if (id) {

      let programId: string = (this.form.program.value === this.currentProgram?.id) ? this.currentProgram?.id : this.form.program.value;
      const url: string = `/configurator/programs/${programId}/work-locations/${id}`;

      this.userService.get(url).subscribe({
          next: (res: any) => {
            if (res?.work_location) {
              const { work_location } = res;
              this.workLocationList = this.sortPipe.transform([...this.workLocationList, {
                id: work_location?.id,
                name: work_location?.name || 'Undefined',
                code: work_location?.code || '--'
              }], 'name');
            }
          },
          error: (err: any) => {
            this.alert.error(errorHandler(err));
          }
        }
      );
    }
  }

  getChipName(id: string) {
    return this.foundationalDataItemStore.get(id);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub?.unsubscribe());
  }

  isUserTypeClient() {
    return (this.selectedOrgType?.toUpperCase() === 'CLIENT' || this.onAddOrgCategory?.toUpperCase() === 'CLIENT');
  }

  isUserTypeMSP() {
    return (this.selectedOrgType?.toUpperCase() === 'MSP' || this.onAddOrgCategory?.toUpperCase() === 'MSP');
  }

  get isCFallowed() {
    return AllowedCFUserTypes.includes(this.onAddOrgCategory?.toUpperCase());
  }

  get form() {
    return this.AddtoProgramForm?.controls;
  }

  get title() {
    return this.editData?.id ? 'Edit User Attached to program' : 'Add To Program';
  }

  get submit_name() {
    return this.editData?.id ? 'Update Program' : 'Add To Program';
  }

  get defaultWorkLocationList() {
    if(this.allWorkLocationsSelected) {
      return this.workLocationList;
    }

    let values: Array <string> = this.AddtoProgramForm?.get('work_location')?.value || [];
    return this.workLocationList.filter((entry: any) => values.includes(entry?.id));
  }

  get defaultHierarchyList() {
    if(this.isAllHierarchiesSelected) {
      return this.hierarchyList;
    }

    return this.hierarchyList.filter((entry: any) => this.selections.includes(entry?.id));
  }

  get isAllHierarchiesSelected() {
    if(this.selectAllHierarchies) {
      return true;
    }

    if(this.hierarchyLoading) {
      return false;
    }

    let allHierarchies: Array <string> = this.hierarchyList.map((entry: any) => entry?.id);
    return (_.xor(allHierarchies, this.selections)?.length === 0);
  }

  get profileProgramView(): boolean {
    return this.router.url.includes('/users/profile-view');
  }

  get profileOrganizationView(): boolean {
    return (
      this.router.url.includes('user-management/profile-view') ||
      this.router.url.includes('users/organization-users/profile-view')
    );
  }
}
