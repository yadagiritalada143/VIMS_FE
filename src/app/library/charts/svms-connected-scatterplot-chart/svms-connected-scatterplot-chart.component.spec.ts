import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SvmsConnectedScatterplotChartComponent } from './svms-connected-scatterplot-chart.component';

describe('SvmsConnectedScatterplotChartComponent', () => {
  let component: SvmsConnectedScatterplotChartComponent;
  let fixture: ComponentFixture<SvmsConnectedScatterplotChartComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SvmsConnectedScatterplotChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsConnectedScatterplotChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
