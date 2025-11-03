import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { SvmsDatepickerComponent } from './svms-datepicker.component';

describe('SvmsDatepickerComponent', () => {
  let component: SvmsDatepickerComponent;
  let fixture: ComponentFixture<SvmsDatepickerComponent>;
  CommonTestingModule.setUpTestBed(SvmsDatepickerComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SvmsDatepickerComponent ]

    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsDatepickerComponent);

    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
