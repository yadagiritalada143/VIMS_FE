import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { DateTimePickerComponent } from './date-time-picker.component';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { SvmsDatepickerComponent } from 'src/app/shared/components/svms-datepicker/svms-datepicker.component';

describe('DateTimePickerComponent', () => {
  let component: DateTimePickerComponent;
  let fixture: ComponentFixture<DateTimePickerComponent>;
  CommonTestingModule.setUpTestBed(DateTimePickerComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DateTimePickerComponent, SvmsDatepickerComponent ],
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DateTimePickerComponent);
    component = fixture.componentInstance;
    component.form = new UntypedFormBuilder().group({
      date: [null, Validators.required], 
      startTime: [null, Validators.required],
      endTime: [null, Validators.required],
      i: [null, Validators.required],
      j: [null, Validators.required],
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
