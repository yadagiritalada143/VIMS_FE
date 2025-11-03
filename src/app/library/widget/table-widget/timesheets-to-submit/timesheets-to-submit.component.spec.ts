import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TimesheetsToSubmitComponent } from './timesheets-to-submit.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('TimesheetsToSubmitComponent', () => {
  let component: TimesheetsToSubmitComponent;
  let fixture: ComponentFixture<TimesheetsToSubmitComponent>;
  CommonTestingModule.setUpTestBed(TimesheetsToSubmitComponent);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TimesheetsToSubmitComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimesheetsToSubmitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
