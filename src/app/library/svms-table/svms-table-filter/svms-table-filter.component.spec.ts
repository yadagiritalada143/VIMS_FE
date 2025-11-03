import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SvmsTableFilterComponent } from './svms-table-filter.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';

describe('SvmsTableFilterComponent', () => {
  let component: SvmsTableFilterComponent;
  let fixture: ComponentFixture<SvmsTableFilterComponent>;
  CommonTestingModule.setUpTestBed(SvmsTableFilterComponent);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SvmsTableFilterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsTableFilterComponent);
    component = fixture.componentInstance;
    component.filterForm = new UntypedFormGroup({
      name: new UntypedFormControl(),
      title: new UntypedFormControl(),
      placeholder:new UntypedFormControl(),
      options: new UntypedFormControl(),
      loading: new UntypedFormControl(),
      type: new UntypedFormControl(),
      onSearch: new UntypedFormControl(),
      onChange: new UntypedFormControl(),
      onOpen: new UntypedFormControl(),
      config: new UntypedFormControl(),
      disabled: new UntypedFormControl(),
      dateChanged: new UntypedFormControl(),
      timeChanged: new UntypedFormControl(),
      scrolledToEnd: new UntypedFormControl(),
      advanceFilter: new UntypedFormControl(),
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
