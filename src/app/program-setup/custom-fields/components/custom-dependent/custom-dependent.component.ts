import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Subscription } from 'rxjs-compat/Subscription';
import { UserService } from 'src/app/core/services/user.service';
import { ICustomField } from '../../interfaces/custom-fields.interface';
import * as _ from 'lodash';
import { EmitEvent, EventStreamService, Events } from 'src/app/core/services/event-stream.service';

@Component({
  selector: 'app-custom-dependent',
  templateUrl: './custom-dependent.component.html',
  styleUrls: ['./custom-dependent.component.scss'],
})
export class CustomDependentComponent implements OnInit, OnDestroy {

  @Input() programId: string;
  @Input() dependLabel: string;
  @Input() conditionFields;
  @Input() isEditMode: boolean;

  public moduleName: string = null;
  @Input('moduleName') set modules(data: string) {

    let oldArray: Array <string> = this.moduleName?.split(',') ?? [];
    let newArray: Array <string> = (data?.split(',') ?? []);

    // Clear values if not subset
    if (!this.isSubset(oldArray, newArray)) {
      this.resetDependsOn();
      this.initializeForm();
    }

    this.moduleName = data;
    this.getModuleFields();
  };

  private hierarhies: Array <string> = [];
  @Input() set selectedHierarchies(h: Array <any>) {

    let oldArray: Array <string> = this.hierarhies.map((data: any) => data?.id ?? data) ?? [];
    let newArray: Array <string> = (h ?? [])?.map((data: any) => data?.id ?? data);

    // Clear values if not subset
    if (!this.isSubset(oldArray, newArray)) {
      this.resetDependsOn();
      this.initializeForm();
    }

    this.hierarhies = h;
    this.getModuleFields();
  }

  @Output() selectDependent = new EventEmitter<ICustomField[]>();
  @Output() changeDependentValidity = new EventEmitter<boolean>();

  public dependentForm: UntypedFormGroup;
  public fields: ICustomField[] = [];

  private subscriptions: Subscription[] = [];
  private page = 1;
  private limit = 50;
  private customFields: ICustomField[] = [];
  private listEnd = false;

  constructor(
    private fb: UntypedFormBuilder, 
    private userService: UserService,
    private eventStream: EventStreamService
  ) {}

  get resultingFields(): UntypedFormArray {
    return this.dependentForm.get('resultingFields') as UntypedFormArray;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.getModuleFields();
  }

  private initializeForm() {
    this.dependentForm = this.fb.group({
      resultingFields: this.fb.array([]),
    });
    this.resultingFields.push(this.createResultingField());
  }

  private createResultingField(fieldLabel?: string) {
    return this.fb.group({
      label: fieldLabel || null,
    });
  }

  private getModuleFields() {
    if (this.hierarhies?.length) {
      let query: string = '&active=true';
      query = query + (this.hierarhies?.length ? `&hierarchy_ids=${this.hierarhies.join(',')}` : '');
      this.subscriptions.push(
        this.userService.getAllCustomFieldsList(this.programId, this.page, this.limit, this.moduleName, query).subscribe((data:any) => {
          const customFields = data.custom_fields.filter(({ label }) => label !== this.dependLabel);
          this.customFields = customFields;
          this.fields = this.customFields.filter(field => !this.resultingFields.value.some(({ label }) => label === field.label));
          if (data.custom_fields.length < this.limit) {
            this.listEnd = true;
          }
          if (this.conditionFields?.length) {
            this.conditionFields.forEach(field => this.addDependentField(field.label));
            this.resultingFields.removeAt(0);
            if(this.customFields.length > 0){
              let fieldss = this.customFields.filter(field => this.conditionFields.some(c => c.label === field.label));
              this.selectDependent.emit(fieldss);
              this.fields = this.customFields.filter(field => !fieldss.some(({ label }) => label === field.label));
            }
          } else {
            this.fields = this.customFields;
          }
          this.validateFields();
        }),
      );
    }
  }

  private emitDependentFields() {
    const updatedFields = this.customFields.filter(field => this.resultingFields.value.some(({ label }) => label === field.label));
    this.selectDependent.emit(updatedFields);
  }

  private validateFields() {
    this.resultingFields.controls.forEach(control => {
      if (control.value.label?.length && this.customFields.every(field => field.label !== control.value.label)) {
        control.setErrors({ incorrect: true });
      } else {
        control.setErrors(null);
      }
    });
    this.changeDependentValidity.emit(this.resultingFields.invalid);
  }

  public addDependentField(label?: string) {
    this.resultingFields.push(this.createResultingField(label));
    this.changeDependentValidity.emit(this.resultingFields.invalid);
  }

  public selectChange(event, i) {
    this.fields = this.customFields.filter(field => !this.resultingFields.value.some(({ label }) => label === field.label));
    this.emitDependentFields();
  }

  public removeDependentField(i: number) {
    if (this.resultingFields.length > 1) {
      this.resultingFields.removeAt(i);
    } else {
      this.resultingFields.reset();
    }
    this.fields = this.customFields.filter(field => !this.resultingFields.value.some(({ label }) => label === field.label));
    this.emitDependentFields();
    this.changeDependentValidity.emit(this.resultingFields.invalid);
  }

  public loadMoreFields() {
    if (!this.listEnd && this.hierarhies?.length) {
      const hierarhiesQuery = this.hierarhies?.length ? `&hierarchy_ids=${this.hierarhies.join(',')}` : '';
      this.subscriptions.push(
        this.userService
          .getAllCustomFieldsList(this.programId, this.page + 1, this.limit, this.moduleName, hierarhiesQuery)
          .subscribe((data:any) => {
            this.page = this.page + 1;
            this.customFields = [...this.fields, ...data.custom_fields.filter(({ label }) => label !== this.dependLabel)];
            this.fields = this.customFields;
            if (data.custom_fields.length < this.limit) {
              this.listEnd = true;
            }
            this.validateFields();
          }),
      );
    }
  }

  isSubset(a: Array <any>, b: Array <any>) {
    return (a.length === _.intersection(a, b).length);
  }

  resetDependsOn() {
    this.eventStream.emit(new EmitEvent(Events.RESET_DEPENDS_ON, []));
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
