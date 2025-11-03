import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { CreatePreIdentifiedCandidateComponent } from './create-pre-identified-candidate.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { SvmsDatepickerComponent } from '../svms-datepicker/svms-datepicker.component';
import { SearchAddressComponent } from '../search-address/search-address.component';
describe('CreatePreIdentifiedCandidateComponent', () => {
  let component: CreatePreIdentifiedCandidateComponent;
  let fixture: ComponentFixture<CreatePreIdentifiedCandidateComponent>;
  CommonTestingModule.setUpTestBed(CreatePreIdentifiedCandidateComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreatePreIdentifiedCandidateComponent, SvmsDatepickerComponent, SearchAddressComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreatePreIdentifiedCandidateComponent);
    component = fixture.componentInstance;
    component.createCandidateForm = new UntypedFormGroup({
      id: new UntypedFormControl(),
      vendorName: new UntypedFormControl(),
      first_name: new UntypedFormControl(),
      middle_name: new UntypedFormControl(),
      last_name: new UntypedFormControl(),
      state_ID: new UntypedFormControl(),
      email: new UntypedFormControl(),
      phone_number: new UntypedFormControl(),
      iso2_code: new UntypedFormControl(),
      country_name: new UntypedFormControl(),
      phone_isdcode: new UntypedFormControl(),
      vendor_id: new UntypedFormControl(),
      retiree: new UntypedFormControl(),
      date_of_birth: new UntypedFormControl(),
      address: new UntypedFormControl(),
      notes: new UntypedFormControl(),
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
