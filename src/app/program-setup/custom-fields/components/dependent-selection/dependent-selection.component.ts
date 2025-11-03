import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { IDependsOn } from '../../interfaces/custom-fields.interface';
import { IPicklistOption } from '../picklist/picklist-options.interface';

@Component({
  selector: 'app-dependent-selection',
  templateUrl: './dependent-selection.component.html',
  styleUrls: ['./dependent-selection.component.scss'],
})
export class DependentSelectionComponent implements OnInit, OnChanges {
  @Input() dependsOn: IDependsOn;
  @Input() moduleName: string;
  @Input() programId: string;
  @Input() dependLabel: string;
  @Input() dropdownSelection: IPicklistOption[];
  @Input() isEditMode: boolean;
  @Input() selectedHierarchies = [];

  @Output() selectDependent = new EventEmitter<any>();
  @Output() changeDependentValidity = new EventEmitter<boolean>();

  public dependentSelectionForm: UntypedFormGroup;
  public selectionOptions: { label: string; value: string }[];
  public isResultingFieldAllowed: boolean = true;

  constructor(private fb: UntypedFormBuilder) {}

  get selectionArray(): UntypedFormArray {
    return this.dependentSelectionForm?.get('selection') as UntypedFormArray;
  }

  ngOnInit(): void {

    this.dependentSelectionForm = this.fb.group({
      selection: this.fb.array([]),
    });

    this.selectionOptions = this.dropdownSelection;
    if (this.dependsOn && this.dependsOn.conditions?.length && this.dependsOn.conditions?.some(cond => cond.condition.operator === '=')) {
      let it: number = 0;
      this.dependsOn.conditions.forEach(({ condition }, idx) => {
        if (
          condition.operator === '=' &&
          !this.selectionArray.controls.some(c => c.get('valueFromSelection')?.value?.value === condition.value)
        ) {
          this.selectionArray.push(this.createDependSelection());
          if (this.selectionOptions?.length) {
            this.selectionArray
              ?.at(it)
              ?.get('valueFromSelection')
              ?.setValue(this.selectionOptions.find(option => option.value === condition.value));
            this.selectionOptions = this.selectionOptions.filter(option => option.value !== condition.value);
            it++;
          }
        }
      });
    } else {
      this.selectionArray.push(this.createDependSelection());
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if(changes?.dropdownSelection?.currentValue?.length != changes?.dropdownSelection?.previousValue?.length) {
      this.selectionOptions = this.selectionArray?.controls?.length ? this.dropdownSelection?.filter(
        ({ value }) => !this.selectionArray.controls.some(ctr => ctr?.get('valueFromSelection')?.value?.value === value),
      ) : this.dropdownSelection;
    } else {
      for(let i=0; i<(changes?.dropdownSelection?.currentValue?.length ?? 0); i++) {
        if(changes.dropdownSelection.currentValue[i].label != changes.dropdownSelection.previousValue[i].label) {
          this.selectionOptions = this.selectionArray?.controls?.length ? this.dropdownSelection?.filter(
            ({ value }) => !this.selectionArray.controls.some(ctr => ctr?.get('valueFromSelection')?.value?.value === value),
          ) : this.dropdownSelection;
        }
      }
    }
  }

  public createDependSelection() {
    return this.fb.group({
      valueFromSelection: [null],
      resultingFields: [null],
    });
  }

  public changeDependent(event, idx) {
    this.selectionArray.at(idx).get('resultingFields').setValue(event);
    this.selectDependent.emit(this.dependentSelectionForm.value.selection);
  }

  public addNewSelection() {
    this.selectionArray.push(this.createDependSelection());
  }

  public selectionChange() {
    this.selectionOptions = this.dropdownSelection.filter(
      ({ value }) => !this.selectionArray.controls.some(ctr => ctr.get('valueFromSelection').value.value === value),
    );
    this.selectDependent.emit(this.dependentSelectionForm.value.selection);
  }

  public fieldsForSelection(idx: number) {
    return this.dependsOn?.conditions?.length
      ? this.dependsOn.conditions.filter(cond =>
          cond.condition?.value ? cond.condition?.value === this.selectionArray.at(idx).get('valueFromSelection')?.value?.value : true,
        )
      : null;
  }

  public removeSelection(idx: number) {
    if (this.selectionArray.length > 1) {
      this.selectionArray.removeAt(idx);
    } else {
      this.selectionArray.reset();
    }
    this.selectDependent.emit(this.dependentSelectionForm.value.selection);
    this.changeDependentValidity.emit(false);
  }
}
