import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TimesheetsRejectedComponent } from './timesheets-rejected.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('TimesheetsRejectedComponent', () => {
  let component: TimesheetsRejectedComponent;
  let fixture: ComponentFixture<TimesheetsRejectedComponent>;
  CommonTestingModule.setUpTestBed(TimesheetsRejectedComponent);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TimesheetsRejectedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimesheetsRejectedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
