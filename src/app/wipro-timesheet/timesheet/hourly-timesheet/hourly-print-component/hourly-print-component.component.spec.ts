import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { HourlyPrintComponentComponent } from './hourly-print-component.component';
import { RemovePrefixSuffixPipe } from 'src/app/shared/pipe/remove-prefix-suffix.pipe';
describe('HourlyPrintComponentComponent', () => {
  let component: HourlyPrintComponentComponent;
  let fixture: ComponentFixture<HourlyPrintComponentComponent>;
  CommonTestingModule.setUpTestBed(HourlyPrintComponentComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ HourlyPrintComponentComponent , RemovePrefixSuffixPipe ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HourlyPrintComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
