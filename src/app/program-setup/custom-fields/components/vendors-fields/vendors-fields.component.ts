import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { CustomFieldsService } from '../../custom-fields.service';
import { errorHandler } from 'src/app/shared/util/error-handler';

@Component({
  selector: 'app-vendors-fields',
  templateUrl: './vendors-fields.component.html',
  styleUrls: ['./vendors-fields.component.scss'],
})
export class VendorsFieldsComponent implements OnInit {
  @Input() programId: string;
  @Input() isEditMode: boolean;
  @Input() customField?;

  @Output() changeVendorFields = new EventEmitter();

  public vendorForm: UntypedFormGroup;
  public rolesAllowed: Array <any> = [];
  public vendors = [];
  public viewRoles = [];
  public viewVendorsLoading = false;
  public editVendorItems = [];
  public input$ = new Subject<string | null>();
  private subscrptions: Subscription[] = [];

  constructor(
    private fb: UntypedFormBuilder, 
    private customFieldsService: CustomFieldsService
  ) {}

  public getCanView(): UntypedFormControl {
    return this.vendorForm.get('can_view') as UntypedFormControl;
  }

  public getViewVendors(): UntypedFormControl {
    return this.vendorForm.get('view_vendors') as UntypedFormControl;
  }

  public getCanEdit(): UntypedFormControl {
    return this.vendorForm.get('can_edit') as UntypedFormControl;
  }

  public getEditVendors(): UntypedFormControl {
    return this.vendorForm.get('edit_vendors') as UntypedFormControl;
  }

  ngOnInit(): void {
    this.fillForm();
    this.getRoles();
    if (this.customField) {
      this.initializeVendorsSelects(this.customField);
    }
    this.getVendors();
    this.input$.pipe(debounceTime(1000)).subscribe((newTerm:any) => {
      this.viewVendorsLoading=false;
        this.getVendors(newTerm);
    });
    this.emitVendorsChange();
  }

  private fillForm() {
    this.vendorForm = this.fb.group({
      can_view: [null, Validators.required],
      view_vendors: [null],
      can_edit: [null, Validators.required],
      edit_vendors: [null],
    });
  }

  private initializeVendorsSelects(customField) {
    customField.entity_refs.forEach(entity => {
      if(entity){
        entity = entity ? entity : []
        const viewVendors = [];
        const editVendors = [];
        entity?.can_view.forEach(({ organizations }) => viewVendors.push(...organizations.map(org => ({ vendor: org }))));
        entity?.can_edit.forEach(({ organizations }) => editVendors.push(...organizations.map(org => ({ vendor: org }))));
        this.viewRoles = entity.can_view.map(({ organization_category }) => organization_category);
        this.getVendors();
        this.vendorForm.patchValue({
          module: entity.entity_ref,
          can_view: entity.can_view.map(({ organization_category }) => organization_category),
          view_vendors: viewVendors,
          can_edit: entity.can_edit.map(({ organization_category }) => organization_category),
          edit_vendors: editVendors,
        });
      }
    });
  }

  public getVendors(term?) {
    this.viewVendorsLoading = true
    this.subscrptions.push(this.customFieldsService.getVendors(this.programId,term).subscribe((data:any) => {
      this.viewVendorsLoading = false;
      this.vendors = data.program_vendors;
    }, (err) => {
      // this.alertService.error(errorHandler(err));
      this.viewVendorsLoading = false;
    }));
  }

  private getRoles() {
    this.customFieldsService.getRoles(this.programId).subscribe({
        next: (res: any) => {
          this.rolesAllowed = [...Object.values(res?.data || {})].map((entry: string) => {
            return {
              name: entry?.toString(), 
              id: entry?.toUpperCase()
            }
          });
        }, error: (err: any) => {
          console.error(errorHandler(err));
        }
      }
    )
  }

  public updateVendorsFields() {
    const canViewRoles = this.getCanView().value;
    const canEditRoles = this.getCanEdit().value?.filter(role => canViewRoles?.includes(role));
    this.getCanEdit().setValue(canEditRoles);
    this.getEditVendorItems();
    this.emitVendorsChange();
  }

  public getEditVendorItems() {
    if (this.getCanEdit().value?.length && this.getViewVendors().value?.length) {
      this.editVendorItems = this.getViewVendors().value;
    } else {
      this.editVendorItems = [];
    }
  }

  public viewRolesChange(event) {
    this.viewRoles = event;
    this.getVendors();
    this.updateVendorsFields();
  }

  public editVendorsChange() {
    this.emitVendorsChange();
  }

  public emitVendorsChange() {
    const { can_view, view_vendors, can_edit, edit_vendors } = this.vendorForm.value;
    this.changeVendorFields.emit({ can_view, view_vendors, can_edit, edit_vendors });
  }
}
