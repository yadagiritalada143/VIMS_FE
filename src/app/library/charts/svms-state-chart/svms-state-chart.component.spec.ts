import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SvmsStateChartComponent } from './svms-state-chart.component';

describe('SvmsStateChartComponent', () => {
  let component: SvmsStateChartComponent;
  let fixture: ComponentFixture<SvmsStateChartComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SvmsStateChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsStateChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
