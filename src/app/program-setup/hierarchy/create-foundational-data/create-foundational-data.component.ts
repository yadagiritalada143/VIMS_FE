import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { EventStreamService, Events, EmitEvent } from 'src/app/core/services/event-stream.service';
import { ActivatedRoute } from '@angular/router';
import { Validators, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { ProgramService } from 'src/app/programs/program.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ProgramConfig } from '../../../shared/enums';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { errorHandler } from '../../../shared/util/error-handler';
import { Observable, Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { LoaderService } from 'src/app/core/components/loader/loader.service';

type MasterItem = {
  id: string,
  name: string,
  slug: string,
  items?: Array <any>,
  selected?: Array <string>,
  default?: string,
  loading?: boolean,
  selectionMap?: Map <string, boolean>,
  defaultMap?: Map <string, boolean>,
  selectionSet?: Set <string>,
  defaultSet?: Set <string>,
  editable?: Array<string>,
};

@Component({
  selector: 'app-create-foundational-data',
  templateUrl: './create-foundational-data.component.html',
  styleUrls: ['./create-foundational-data.component.scss']
})
export class CreateFoundationalDataComponent implements OnInit, OnDestroy {

  private subscriptions: Subscription[] = [];
  private isUpdateReq: boolean = false;
  private toUPdateIteamId: string = null;
  private masterSubject: Subject <any> = new Subject <string> ();
  private masterLoaderIndex: number = -1;

  public associatedMasterDataTypes: Array <MasterItem> = [];

  @Input() title: string;
  @Input() icon: string;
  @Input() type: string;
  @Input('details') set setDetails(data) {
    if (data) {
      this.currentDataType = data
      const fd_types: Array<any> = data.dependent_foundational_data_types;
      if (fd_types && Array.isArray(fd_types)) {

        this.associatedMasterDataTypes = fd_types;
        this.associatedMasterDataTypes
          .forEach((details: MasterItem, it: number) => {
            this.fetchMasterItemDetails(details.id, it, null)
              .subscribe((res:any) => {

                let items: Array<any> = res.foundational_data;
                if (items && Array.isArray(items)) {

                  items = items.map(node => {

                    let code: string = node?.code;
                    if (!this.showMasterCodesOnly) {
                      code = node.name + (node?.code ? ` (${node.code})` : '');
                    }

                    return {
                      id: node.id,
                      name: code
                    }
                  });

                  this.associatedMasterDataTypes[it].items = items;
                  this.associatedMasterDataTypes[it].loading = false;
                  this.associatedMasterDataTypes[it].selectionMap = new Map<string, boolean>();
                  this.associatedMasterDataTypes[it].defaultMap = new Map<string, boolean>();
                  this.associatedMasterDataTypes[it].defaultSet = new Set <string> ();
                  this.associatedMasterDataTypes[it].selectionSet = new Set <string> ();

                }
              }, err => {
                this.associatedMasterDataTypes[it].loading = false;
                this._alertService.error(errorHandler(err));
              });
          });

      }
    }
  };

  foundationData = 'hidden';
  isViewMode = false;
  membersList = [];
  buttonLabel = "Save";
  clickOutside: boolean;

  public addFoundationDataForm: UntypedFormGroup;
  public selectorMounted: boolean = true;
  public currentDataType: any = {};
  public managerLoading: boolean = false;
  public managerSubject: Subject<string> = new Subject<string>();
  public programDetails = JSON.parse(this.storageService.get(ProgramConfig[0]));
  public toggle = {
    title: 'active',
    value: true
  }

  constructor (
    private eventStream: EventStreamService,
    private route: ActivatedRoute,
    private fb: UntypedFormBuilder,
    private _programService: ProgramService,
    private storageService: StorageService,
    private _alertService: AlertService,
    private loader: LoaderService
  ) { }

  ngOnInit(): void {

    this.currentDataType = this.route.queryParams['_value'];
    this.addFoundationDataForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      code: ['', Validators.required],
      manager: this.currentDataType['configuration']?.require_owner == 'true' ? ['', Validators.required] : [],
      is_enabled: [true, Validators.required],
    });

    //Create Foundational Data form
    this.subscriptions.push(
      this.eventStream.on(Events.FOUNDATION_DATA_CREATE)
        .subscribe((data:any) => {

          this.title = `Add New (${this.currentDataType['name']})`;
          if (data) {
            this.foundationData = 'visible';
          } else {
            this.foundationData = 'hidden';
          }

          this.clickOutside = false;
          this.managerSubject.next('');
        }
      )
    );

    //Edit Foundational Data form
    this.subscriptions.push(
      this.eventStream.on(Events.FOUNDATIONAL_DATA_EDIT)
        .subscribe((data:any) => {

          this.title = `Edit (${this.currentDataType['name']})`;
          if (data.event) {

            this.fetchMasterEntryDetails(data.data.id).then(res => {
              if(res.flag) {

                if(res.foundational_data)
                  res = res.foundational_data;

                data.data = res;
                this.toggle.value = data.data.is_enabled;
                this.toggle.title = data.data.is_enabled == true ? 'active' : 'inactive';
                this.foundationData = 'visible';
                this.addFoundationDataForm.patchValue(data.data);
                if(this.currentDataType['configuration']?.require_owner == 'true') {
                  this.addFoundationDataForm.get('manager').patchValue(data.data.manager[0]?.user_id)
                } else {
                  let selected_member = data.data.manager;
                  let arr = selected_member.map(({user_id}) => user_id);
                  this.addFoundationDataForm.get('manager').patchValue(arr?.join(','));
                }

                this.isUpdateReq = true;
                this.toUPdateIteamId = data.data.id;
                this.buttonLabel = "Update";

                if(data.data["foundational_data_mapping"])
                  this.appendDependedFields(data.data["foundational_data_mapping"]);
              }
            })
          }

          this.clickOutside = false;
          this.managerSubject.next('');
        }
      )
    );

    //View Foundational Data form
    this.subscriptions.push(
      this.eventStream.on(Events.FOUNDATIONAL_DATA_VIEW)
        .subscribe((data:any) => {

          this.clickOutside = true;
          this.title = `${this.currentDataType['name']} detail view`;
          this.isViewMode = true;
          if (data?.event) {

            this.fetchMasterEntryDetails(data?.data?.id)
            .then(res => {
              if(res.flag) {

                if(res.foundational_data)
                  res = res.foundational_data;

                data.data = res;
                this.toggle.value = data?.data?.is_enabled;
                this.toggle.title = data?.data?.is_enabled == true ? 'active' : 'inactive';
                this.foundationData = 'visible';
                this.addFoundationDataForm.patchValue(data?.data);
                if(this.currentDataType['configuration']?.require_owner == 'true') {
                  this.addFoundationDataForm.get('manager').patchValue(data?.data?.manager[0]?.user_id)
                } else {
                  let selected_member = data?.data?.manager;
                  let arr = selected_member.map(({user_id}) => user_id);
                  this.addFoundationDataForm.get('manager').patchValue(arr?.join(','));
                }

                if(data.data["foundational_data_mapping"])
                  this.appendDependedFields(data.data["foundational_data_mapping"]);
              }
            });
          }
        }
      )
    );

    // Search Managers
    this.subscriptions.push(
      this.managerSubject.pipe(
        distinctUntilChanged((prev: string, curr: string) => (prev === curr)),
        debounceTime(600),
        switchMap((term: string) => {

          const programId = this.storageService.get(StorageKeys.PROGRAM_ID);
          let url = `/configurator/programs/${programId}/members?org_category=CLIENT`;

          if (term)
            url += `&name=${term}`;
          this.managerLoading = true;

          return this._programService.get(url);
        })
      ).subscribe({
        next: (res: any) => {
          if (res) {
            this.managerLoading = false;
            this.membersList = res.members;
          }
        }, error: (err: any) => {
          this.managerLoading = false;
          this._alertService.error(errorHandler(err));
        }
      })
    );

    // Search Master Data Item
    this.subscriptions.push(
      this.masterSubject
      .pipe(
        debounceTime(400),
        switchMap((details: any) => {
          const { id, index, term } = details;
          this.masterLoaderIndex = index;
          this.associatedMasterDataTypes[index].loading = true;
          return this.fetchMasterItemDetails(id, index, term);
        })
      )
      .subscribe((res:any) => {

        let items: Array <any> = res.foundational_data;
        if(items && Array.isArray(items)) {

          items = items.map(node => {

            let code: string = node?.code;
            if (!this.showMasterCodesOnly) {
              code = node.name + (node?.code ? ` (${node.code})` : '');
            }

            return {
              id: node.id,
              name: code
            }
          });

          const it = this.masterLoaderIndex;
          this.associatedMasterDataTypes[it].items = items;
          this.closeAllLoaders();
        }
      }, err => {
        this._alertService.error(errorHandler(err));
        this.closeAllLoaders();
      })
    );

    this.managerSubject.next('');
  }

  fetchMasterItemDetails(id: string, it: number, term: string = null): Observable <any> {

    let programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    let url = `/configurator/programs/${programId}/foundational-data-types/${id}/foundational-data?limit=10`;

    if(term)
      url += `&name=${term}`;

    return this._programService.get(url);

  }


  onClickToggle() {

    if (this.toggle.value) {
      this.toggle.value = false;
      this.toggle.title = 'inactive';
    } else {
      this.toggle.value = true;
      this.toggle.title = 'active';
    }

    this.addFoundationDataForm.get('is_enabled').setValue(this.toggle.value);

  }

  sidebarClose() {

    this.selectorMounted = false;
    setTimeout(()=> {
      this.selectorMounted = true;
    }, 1200);

    // Reset master data selections
    this.associatedMasterDataTypes.forEach((node: MasterItem, it) => {
      this.associatedMasterDataTypes[it].default = null;
      this.associatedMasterDataTypes[it].selected = [];
      this.associatedMasterDataTypes[it].editable = [];
      this.associatedMasterDataTypes[it].loading = false;
      if(this.isUpdateReq) {
        this.associatedMasterDataTypes[it].defaultMap.clear();
        this.associatedMasterDataTypes[it].selectionMap.clear();
        this.associatedMasterDataTypes[it].defaultSet.clear();
        this.associatedMasterDataTypes[it].selectionSet.clear();
      }
      return node;
    });

    this.eventStream.emit(new EmitEvent(Events.FOUNDATION_DATA_CREATE, false));
    this.isViewMode = false;
    this.addFoundationDataForm.reset();
    this.toggle.value = true;
    this.toggle.title = 'active';
    this.addFoundationDataForm.get('is_enabled').setValue(this.toggle.value);
    this.buttonLabel = "Save";
  }

  saveFoundationalData() {
    const programId = this.programDetails['program_req_id'];
    const addDataForm = this.addFoundationDataForm.value;
    const payLoad = {
      name: addDataForm.name,
      description: addDataForm.description ? addDataForm.description : '',
      is_enabled: addDataForm.is_enabled,
      code: addDataForm.code,
      manager_id:this.currentDataType['configuration']?.require_owner == 'true' ? addDataForm.manager ? addDataForm.manager : null : addDataForm.manager ? addDataForm.manager : null,
    }

    // if(!payLoad.manager_id.length) delete payLoad.manager_id;

    if (this.addFoundationDataForm.valid) {
      if (this.isUpdateReq) {
        if(this.finalPUTPayloadBrushup(payLoad)) {
          this.subscriptions.push(
            this._programService.put(
              `/configurator/programs/${programId}/foundational-data-types/${this.currentDataType['id']}/foundational-data/${this.toUPdateIteamId}`, payLoad)
              .subscribe(data => {
                if (data) {
                  this.isUpdateReq = false;
                  this.sidebarClose();
                  this._alertService.success(`You have saved Master data successfully.`);
                  this.eventStream.emit(new EmitEvent(Events.FOUNDATION_DATA_LIST, true));
                  this.managerSubject.next('');
                }
              },
                (err) => {
                  this._alertService.error(errorHandler(err));
                }
              )

          );

        };
      } else {
        if (this.finalPOSTPayloadBrushup(payLoad)) {
          this.subscriptions.push(
            this._programService.post(
              `/configurator/programs/${programId}/foundational-data-types/${this.currentDataType['id']}/foundational-data`, payLoad)
              .subscribe(data => {
                if (data) {
                  this.sidebarClose();
                  this._alertService.success('Master data created Successfully..');
                  this.eventStream.emit(new EmitEvent(Events.FOUNDATION_DATA_LIST, true));
                }
              },
                (err) => {
                  this._alertService.error(errorHandler(err));
                }
              ));
        }
      }
    } else {
      this.addFoundationDataForm.markAllAsTouched();
      this._alertService.error('Please fill the required fields.', {});
    }
  }

  searchManagerList(evt) {
    const { term } = evt;
    this.managerSubject.next(term);
  }

  onMasterItemSearch(term: string, it: number, id: string) {
    this.masterSubject.next({
      id: id,
      index: it,
      term: term
    });
  }

  // Append Depended field entries
  appendDependedFields(fields: Array <any>) {

    // Initialization
    let index_mp: Map <string, number> = new Map <string, number> ();
    this.associatedMasterDataTypes.forEach((node: MasterItem, it: number) => {
      index_mp.set(node.id, it);
      node.selectionMap = new Map <string, boolean> ();
      node.defaultMap = new Map <string, boolean> ();
      node.defaultSet = new Set <string> ();
      node.selectionSet = new Set <string> ();
    })

    fields.forEach((node: any) => {
      if(node) {

        const foundational_data_type_id: string = node.foundational_data_type_id;
        const values: Array <any> = node.values;
        const defaults: Array <any> = node.defaults;

        let local_index = index_mp.get(foundational_data_type_id);
        const fieldNode: MasterItem = this.associatedMasterDataTypes[local_index];
        const selectionMap: Map <string, boolean> = fieldNode.selectionMap;
        const defaultMap: Map <string, boolean> = fieldNode.defaultMap;
        const selectionSet: Set <string> = fieldNode.selectionSet;
        const defaultSet: Set <string> = fieldNode.defaultSet;

        fieldNode.selected = [];
        fieldNode.editable = [];
        fieldNode.default = null;

        if(Array.isArray(values)) {
          values.forEach((key: {id: string, name: string, code: string, is_editable: boolean}) => {
              fieldNode.selected.push(key.id);
              key.is_editable? fieldNode.editable.push(key.id): null;
              selectionMap.set(key.id, true);
              selectionSet.add(key.id);
          });
        }

        if(Array.isArray(defaults) && defaults.length) {
          defaults.forEach((key: string) => {
            fieldNode.default = key;
            defaultMap.set(key, true);
            defaultSet.add(key);
          })
        }
      }
    });
  }

  // Append residual entries to POST payload
  finalPOSTPayloadBrushup(payload): boolean {

    let flag: boolean = true;
    payload.foundational_data_mapping = [];
    const tailNode: Array <any> = payload.foundational_data_mapping;

    this.associatedMasterDataTypes.forEach((node: MasterItem, it: number) => {
      if (node && node.selected && node.selected.length) {

        if (!node.default) {
          this._alertService.error(`Atleast one default "${node.name}" is Mandatory`);
          flag = false;
        }

        tailNode.push({
          "foundational_data_type_id": node.id,
          "values": node.selected.map((item: string) => {
            return { keep: true, id: item, is_editable: node.editable.includes(item)? true : false, is_default: node.default == item ? true: false };
          })
        })
      }
    });

    if(!tailNode?.length)
      delete payload.foundational_data_mapping;

    return flag;
  }

  // Append residual entries to PUT payload
  finalPUTPayloadBrushup(payload: any): boolean {

    let flag: boolean = true;
    payload.foundational_data_mapping = [];
    const tailNode: Array<any> = payload.foundational_data_mapping;

    this.associatedMasterDataTypes.forEach((node: MasterItem, it: number) => {
      if (node) {

        if (node.selected && node.selected.length && !node.default) {
          this._alertService.error(`Atleast one default "${node.name}" is Mandatory`);
          flag = false;
        }

        const defaultMap: Map<string, boolean> = node.defaultMap;
        const selectionMap: Map<string, boolean> = node.selectionMap;
        const selectionSet: Set <string> = node.selectionSet;

        let foundational_data_type_id = node.id
        let values: Array<any> = this.appendMapToMasterField(selectionMap, selectionSet, node?.editable) || [];
        let defaults: Array<any> = [];

        let defaultKeys: Array<any> = [...defaultMap.keys()];
        let localTrueCount: number = 0;
        values.forEach(value => {
          localTrueCount = localTrueCount + Number([...Object.values(value)].reduce((a: number, b: number) => Number(a)+Number(b)));
        });

        defaultKeys.forEach((key: string) => {
          if (((selectionSet && selectionSet.has(key)) || selectionMap.get(key)) && defaultMap.get(key)) {
            defaults.push(key);
          }
        });

        if(localTrueCount === 0)
          defaults = [];

        if(values.length){
          values.forEach((value: any) => {
            if(value.keep){
              value['is_default'] = defaults[0] == value?.id ? true: false
            }
          })
          tailNode.push({ foundational_data_type_id, values });
        }
      }
    });

    if(!tailNode?.length)
      delete payload.foundational_data_mapping;

    return flag;
  }

  appendMapToField(mp: Map <string, boolean>, set: Set <string> = null): Array <any> {

    let selections: Array <any> = [];
    const keys = [...mp.keys()];
    keys.forEach((key: string) => {
      if((set && set.has(key) || mp.get(key)))
        selections.push({
          [key]: mp.get(key)
        });
    });

    return selections;
  }

  appendMapToMasterField(mp: Map <string, boolean>, set: Set <string> = null, editable: Array<string>): Array <any> {

    let selections: Array <any> = [];
    const keys = [...mp.keys()];
    keys.forEach((key: string) => {
      if((set && set.has(key) || mp.get(key)))
        if(mp.get(key)){
          selections.push({
            id: key,
            keep: mp.get(key),
            is_editable: editable?.includes(key)
          });
        }
        else{
          selections.push({
            id: key,
            keep: mp.get(key)
          });
        }
    });

    return selections;
  }

  selectMasterItems(evt: Array <string>, it: number) {
    this.associatedMasterDataTypes[it].selected = evt;
    this.associatedMasterDataTypes[it].editable = this.associatedMasterDataTypes[it].editable?.filter((node: any) => {
      if(evt.includes(node))
        return true
    })
    if(this.isUpdateReq) {
      const refMap: Map <string, boolean> = this.associatedMasterDataTypes[it].selectionMap;
      this.updateMapEntries(refMap, evt);
    }
  }

  closeAllLoaders() {
    this.associatedMasterDataTypes.forEach((node: MasterItem) => (node.loading = false));
  }

  changeDefaultSelection(selection: string, it: number) {
    this.associatedMasterDataTypes[it].default = selection;
    if(this.isUpdateReq) {
      const refMap: Map <string, boolean> = this.associatedMasterDataTypes[it].defaultMap;
      this.updateMapEntries(refMap, selection);
    }
  }

  changeEditableSelection(evt: Array<string>, it: number) {
    this.associatedMasterDataTypes[it].editable = evt;
  }

  updateMapEntries(mp: Map <string, boolean>, data: string | Array <string>) {
    if(Array.isArray(data)) {
      this.falsifyMap(mp);
      data.forEach((key: string) => {
        mp.set(key, true);
      });
    } else if((typeof data) === 'string') {
      this.falsifyMap(mp);
      mp.set(data, true);
    }
  }

  falsifyMap(mp: Map <string, boolean>) {
    const keys = [...mp.keys()];
    keys.forEach((key: string) => {
      mp.set(key, false);
    });
  }

  fetchMasterEntryDetails(fd_id: string): Promise <any> {

    let programId: string = this.storageService.get(StorageKeys.PROGRAM_ID);
    let masterId: string = this.currentDataType['id'];

    const url = `/configurator/programs/${programId}/foundational-data-types/${masterId}/foundational-data/${fd_id}`;

    this.loader.show();
    return this._programService.get(url).toPromise().then(res => {
      this.loader.hide();
      return { ...res, flag: true};
    }, err => {
      this.loader.hide();
      this._alertService.error(errorHandler(err));
      return { ...err, flag: false };
    });

  }

  get showMasterCodesOnly() {
    let config: any = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.config;
    return config?.show_only_master_codes;
  }

  get operatorFieldMandatory() {
    if(!this.currentDataType) {
      return true;
    }

    return this.showOperatorField && (this.currentDataType?.configuration?.require_owner === 'true');
  }

  get showOperatorField() {
    if(!this.currentDataType)
      return true;

    return (this.currentDataType?.configuration?.track_owner === 'true');
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
