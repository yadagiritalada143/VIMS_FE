import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { StatsReportWidgetComponent } from './stats-report-widget.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('StatsReportWidgetComponent', () => {
  let component: StatsReportWidgetComponent;
  let fixture: ComponentFixture<StatsReportWidgetComponent>;
  CommonTestingModule.setUpTestBed(StatsReportWidgetComponent);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ StatsReportWidgetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StatsReportWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
