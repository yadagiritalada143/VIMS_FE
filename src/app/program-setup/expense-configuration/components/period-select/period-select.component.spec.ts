import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { PeriodSelectComponent } from './period-select.component';

describe('PeriodSelectComponent', () => {
  let component: PeriodSelectComponent;
  let fixture: ComponentFixture<PeriodSelectComponent>;

  CommonTestingModule.setUpTestBed(PeriodSelectComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(PeriodSelectComponent);
    component = fixture.componentInstance;
    component.form = new UntypedFormGroup({
      count : new UntypedFormControl(),
      units: new UntypedFormControl()
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
