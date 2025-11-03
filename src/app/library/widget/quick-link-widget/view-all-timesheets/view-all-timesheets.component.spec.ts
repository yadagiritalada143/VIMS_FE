import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ViewAllTimesheetsComponent } from './view-all-timesheets.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { StatusComponent } from 'src/app/shared/components/status/status.component';

describe('ViewAllTimesheetsComponent', () => {
  let component: ViewAllTimesheetsComponent;
  let fixture: ComponentFixture<ViewAllTimesheetsComponent>;
  CommonTestingModule.setUpTestBed(ViewAllTimesheetsComponent);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewAllTimesheetsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewAllTimesheetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
