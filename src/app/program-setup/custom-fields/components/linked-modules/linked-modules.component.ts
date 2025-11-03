import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs/internal/Subscription';
import { map } from 'rxjs/operators';
import { CustomFieldsService } from '../../custom-fields.service';

@Component({
  selector: 'app-linked-modules',
  templateUrl: './linked-modules.component.html',
  styleUrls: ['./linked-modules.component.scss'],
})
export class LinkedModulesComponent implements OnInit, OnDestroy {

  @Input() programId: string;
  @Input() isEditMode: boolean;
  @Input() customFieldData;
  @Input() selectedModules = [];
  @Input() showLinkedFieldReadOnly: boolean = true;

  @Output() changeLinked = new EventEmitter();
  @Output() changeselectedLinkedModules = new EventEmitter();

  public fields = [];
  customFieldLinkedData : any = [];
  public linkedModulesForm: UntypedFormGroup;
  selectedFieldsData = [];
  private subscriptions: Subscription[] = [];


  constructor(private customFieldsService: CustomFieldsService, private fb: UntypedFormBuilder) {}

  public get linkedModules(): UntypedFormArray {
    return this.linkedModulesForm.get('modules') as UntypedFormArray;
  }

  public toggle = [{
    is_readonly: {
      title: 'Read-Only',
      value: false
    }
  }];

  ngOnInit(): void {
    this.getModules();
    this.selectedFieldsData = this.selectedModules
    this.linkedModulesForm = this.fb.group({
      modules: this.fb.array([]),
    });
    this.customFieldData ? this.initializeLinkedData(this.customFieldData) : this.linkedModules.push(this.createLinkedModule());
  }

  public createLinkedModule() {
    this.toggle.push({
      is_readonly: {
        title: 'Read-Only',
        value: false
      }
    })
    this.customFieldData = null
    return this.fb.group({
      linkedModule: [null],
      is_readonly:[false],
      vendors: {
        can_view: [null, Validators.required],
        view_vendors: [null],
        can_edit: [null, Validators.required],
        edit_vendors: [null],
      }
    });
  }

  private initializeLinkedData(customField) {
    let linkedModuleData = []
    linkedModuleData = customField?.meta_data?.linked ? customField?.meta_data?.linked.modules : []
    let modules = customField?.entity_refs?.filter(val => linkedModuleData.includes(val.entity_ref));
    this.customFieldLinkedData = {"entity_refs" : modules}
    this.toggle = [];

    this.customFieldLinkedData.entity_refs?.forEach(x => {
      this.selectedFieldsData.push(x.entity_ref);
     // this.fields = this.modules.filter(field => !this.selectedFieldsData.includes(field.code));
      this.linkedModules.push(
        this.fb.group({
          linkedModule: x.entity_ref,
          is_readonly:true,
          vendors: {
            can_view: null,
            view_vendors: null,
            can_edit: null,
            edit_vendors: null
          }
        })
      )
      this.toggle.push({
        is_readonly: {
          title: 'Read-Only',
          value: x.is_readonly
        }
      })
    })
  }

  public addLinkedModule() {
    this.linkedModules.push(this.createLinkedModule());
  }

  onClickToggle(toggles,i) {
    if (toggles === 'is_readonly') {
      if (this.toggle[i]?.is_readonly.value) {
        this.toggle[i].is_readonly.value = false;
      } else {
        this.toggle[i].is_readonly.value = true;
      }
      this.linkedModulesForm.value.modules[i].is_readonly = this.toggle[i]?.is_readonly.value
      this.changeLinked.emit(this.linkedModulesForm.value.modules);
      this.changeselectedLinkedModules.emit(this.linkedModulesForm.value.modules)
    }
  }

  private getModules() {
    this.subscriptions.push(
      this.customFieldsService
        .getAllModules(true)
        .pipe(
          map((res: any) => {
            const modules = [];
            res.module_groups.forEach(group => modules.push(...group.modules));
            return modules;
          }),
        )
        .subscribe((res:any) => {
          this.fields = res
        }),
    );
  }

  public changeVendorFields(event, idx) {
    this.linkedModules.at(idx).get('vendors').setValue(event ? event : '');
    this.linkedModulesForm.value.modules[idx].is_readonly = this.toggle[idx]?.is_readonly?.value
    this.changeLinked.emit(this.linkedModulesForm.value.modules);
    this.changeselectedLinkedModules.emit(this.linkedModulesForm.value.modules)
  }

  public changeModule() {
    this.selectedFieldsData = this.selectedModules;
    this.changeLinked.emit(this.linkedModulesForm.value.modules);
    this.changeselectedLinkedModules.emit(this.linkedModulesForm.value.modules)
  }
  ngOnChanges(changes) {
    this.selectedFieldsData = this.selectedModules
  }
  public removeLinkedModule(idx: number) {
    if (this.linkedModules.length > 1) {
      this.linkedModules.removeAt(idx);
    } else {
      this.linkedModules.reset();
    }
    this.selectedFieldsData = this.linkedModulesForm.value.modules.map(x => x.linkedModule)
    this.changeLinked.emit(this.linkedModulesForm.value.modules);
    this.changeselectedLinkedModules.emit(this.linkedModulesForm.value.modules)
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
