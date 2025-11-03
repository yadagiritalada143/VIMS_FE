import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { SvmsMinMaxPickerComponent } from './svms-min-max-picker.component';

describe('SvmsMinMaxPickerComponent', () => {
  let component: SvmsMinMaxPickerComponent;
  let fixture: ComponentFixture<SvmsMinMaxPickerComponent>;
  CommonTestingModule.setUpTestBed(SvmsMinMaxPickerComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SvmsMinMaxPickerComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsMinMaxPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
