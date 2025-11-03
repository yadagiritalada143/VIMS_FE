import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { AbstractControl, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ProgramService } from 'src/app/programs/program.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { PicklistTableComponent } from '../components/picklist-table/picklist-table.component';
type Visibility = ('visible' | 'hidden');

@Component({
  selector: 'app-picklist-flyout',
  templateUrl: './picklist-flyout.component.html',
  styleUrls: ['./picklist-flyout.component.scss']
})
export class PicklistFlyoutComponent implements OnInit, OnDestroy {

  private subscriptions: Array <Subscription> = [];
  private picklistId: string = null;
  private picklistItemEdit: Array <any> = [];

  public picklistCategory: string = null;
  public isViewMode: boolean = false;
  public isEditMode: boolean = false;
  public isCreateMode: boolean = true;
  public multiselect: boolean = false;
  public picklistForm: UntypedFormGroup = null;
  public initialSelections: Array <any> = [];

  public disabled_program: Array <string> = [];

  get programId() {
    return this.storageService.get(StorageKeys.PROGRAM_ID);
  }

  @Input() visible: Visibility = 'hidden';
  @Output() visibleChange: EventEmitter <Visibility> = new EventEmitter <Visibility> ();
  @Output() sidebarClosed: EventEmitter <boolean> = new EventEmitter <boolean> ();

  @ViewChild(PicklistTableComponent) picklistTable: PicklistTableComponent;

  constructor (
    private loader: LoaderService,
    private alert: AlertService,
    private eventStream: EventStreamService,
    private programService: ProgramService,
    private storageService: StorageService
  ) { }

  ngOnInit(): void {

    this.resetPicklist();

    // View Picklist
    this.subscriptions.push(
      this.eventStream.on(Events.VIEW_PICKLIST)
        .subscribe((data: any) => {
          if (data) {

            this.isViewMode = true;
            this.isEditMode = false;
            this.isCreateMode = false;

            const {
              name,
              is_enabled,
              description,
              picklist_item,
              multiselect,
              disabled_program
            } = data;

            this.disabled_program = disabled_program;
            this.multiselect = multiselect;
            this.picklistForm.patchValue({
              name: name,
              status: is_enabled,
              description: description
            });

            this.initialSelections = [];
            if (Array.isArray(picklist_item)) {
              picklist_item.forEach((entry: any) => {
                this.initialSelections.push({
                  value: entry?.value,
                  label: entry?.label,
                  defined_by: entry?.defined_by,
                  is_enabled: entry?.is_enabled,
                  disabled_program: entry?.disabled_program
                });
              });
            }
          }
        }
      )
    );

    // Edit Picklist
    this.subscriptions.push(
      this.eventStream.on(Events.EDIT_PICKLIST)
        .subscribe((data: any) => {
          if (data) {

            this.isViewMode = false;
            this.isEditMode = true;
            this.isCreateMode = false;

            const {
              name, id,
              is_enabled,
              description,
              picklist_item,
              multiselect,
              defined_by,
              disabled_program
            } = data;

            this.picklistId = id;
            this.picklistCategory = defined_by;
            this.disabled_program = disabled_program;
            this.multiselect = multiselect;
            this.picklistForm.patchValue({
              name: name,
              status: is_enabled,
              description: description
            });

            this.initialSelections = [];
            if (Array.isArray(picklist_item)) {
              picklist_item.forEach((entry: any) => {

                this.picklistItemEdit.push({
                  id: entry?.id,
                  value: entry?.value?.trim(),
                  label: entry?.label?.trim(),
                  defined_by: entry?.defined_by,
                  is_enabled: entry?.is_enabled
                });

                this.initialSelections.push({
                  id: entry?.id,
                  value: entry?.value?.trim(),
                  label: entry?.label?.trim(),
                  defined_by: entry?.defined_by,
                  is_enabled: entry?.is_enabled,
                  disabled_program: entry?.disabled_program
                });
              });
            }
          }
        }
      )
    );

  }

  createPayload(): any {

    const picklistValues: any = this.picklistForm.value;
    let payload: any = {
      name: picklistValues['name'],
      is_enabled: picklistValues['status'],
      disabled_program: this.disabled_program,
      description: picklistValues['description'],
      multiselect: this.multiselect,
      picklist_item: [],
      defined_by: this.isCreateMode?'PROGRAM':this.picklistCategory
    };

    let programCount: number = 0;
    let predefinedCount: number = 0;
    let programEnabledCount: number = 0;
    let predefinedEnabledCount: number = 0;
    this.initialSelections.forEach((entry: any, it: number) => {
      if(entry) {

        if(!entry.id)
          delete entry['id'];

        if(this.picklistTable) {
          entry['label'] = this.picklistTable?.selections[it]?.label ?? entry['label'];
        }

        if(!entry.label)
          entry.label = entry['value'];

        if(entry?.disabled_program)
          delete entry.disabled_program;

        if(entry.defined_by)
          entry.defined_by = entry.defined_by?.toUpperCase();

        if(entry.defined_by === 'PREDEFINED') {
          predefinedCount++;
          if(entry?.is_enabled) {
            predefinedEnabledCount++;
          }
        } else if(entry.defined_by === 'PROGRAM') {
          programCount++;
          if(entry?.is_enabled) {
            programEnabledCount++;
          }
        }

        entry.is_deleted = false;
        payload.picklist_item.push(entry);
      }
    });

    // if(predefinedCount && (predefinedEnabledCount === 0)) {
    //   return 'Atleast one predefined picklist item should be enabled!';
    // }

    // if(programCount && (programEnabledCount === 0)) {
    //   return 'Atleast one program picklist item should be enabled!';
    // }

    if((predefinedCount + programCount) && (predefinedEnabledCount + programEnabledCount === 0)) {
      return `At least one picklist value should be active`;
    }

    // Validation for empty list of picklist items
    if(Array.isArray(payload['picklist_item']) && !payload['picklist_item'].length) {
      return 'Please specify atleast one entry for picklist items';
    }

    if(this.isEditMode) {
      this.picklistItemEdit.forEach((entry: any) => {

        const editId: string = entry?.id;
        const index: number = this.initialSelections.findIndex((selection: any) => {
          return selection?.id === editId;
        });

        if(index === -1) {

          if(entry.defined_by)
            entry.defined_by = entry.defined_by?.toUpperCase();

          entry.is_deleted = true;
          payload.picklist_item.push(entry);
        }
      })
    }

    return payload;
  }

  onSave(): void {
    let payload: any = this.createPayload();
    if(typeof(payload) === 'string') {
      this.alert.error(payload);
      return;
    }

    if(this.isEditMode) {
      this.updatePicklist(payload);
    } else {
      this.createPicklist(payload);
    }
  }

  updatePicklist(payload: any): void {

    const programId: string = this.storageService.get(StorageKeys.PROGRAM_ID);
    const url = `/configurator/programs/${programId}/pick-lists/${this.picklistId}`;

    this.loader.show();
    this.programService.put(url, payload).subscribe((data: any) => {
      if(data) {
        this.loader.hide();
        this.alert.success('Picklists values are updated and configurated successfully');
        this.sidebarClose(true);
      }
    }, err => {
      this.loader.hide();
      this.alert.error(errorHandler(err));
    });
  
  }

  createPicklist(payload: any): void {

    const programId: string = this.storageService.get(StorageKeys.PROGRAM_ID);
    const url = `/configurator/programs/${programId}/pick-lists`;

    this.loader.show();
    this.programService.post(url, payload).subscribe((data: any) => {
      if(data) {
        this.loader.hide();
        this.alert.success('Picklists values are saved and configurated successfully');
        this.sidebarClose(true);
      }
    }, err => {
      this.loader.hide();
      this.alert.error(errorHandler(err));
    });

  }

  sidebarClose(refresh: boolean = false): void {
    this.resetPicklist();
    this.multiselect = false;
    this.initialSelections = [];
    this.isCreateMode = true;
    this.isEditMode = false;
    this.isViewMode = false;
    this.picklistId = null;
    this.picklistCategory = null;
    this.picklistItemEdit = [];
    this.disabled_program = [];
    this.sidebarClosed.emit(refresh);
    this.visibleChange.emit('hidden');
  }

  changeStatus(flag: boolean): void {
    const form: AbstractControl = this.picklistForm;
    form.get('status').setValue(flag);
  }

  resetPicklist(): void {
    this.picklistForm = new UntypedFormGroup({
      name: new UntypedFormControl('', [Validators.required]),
      status: new UntypedFormControl(true, [Validators.required]),
      description: new UntypedFormControl('', []),
    });
  }

  get picklistNameForm() {
    return this.picklistForm.get('name');
  }

  get sidebarTitle() {
    if(this.isCreateMode)
      return 'Add Picklist';
    if(this.isViewMode)
      return 'View Picklist';

    return 'Edit Picklist';
  }

  get isAdmin() {
    return Boolean(this.storageService.get(StorageKeys.USER_TYPE) === 'SUPER_ORG');
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub?.unsubscribe();
    });
  }
}
