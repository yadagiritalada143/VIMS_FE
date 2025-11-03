import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SvmsLiquidFillChartComponent } from './svms-liquid-fill-chart.component';

describe('SvmsLiquidFillChartComponent', () => {
  let component: SvmsLiquidFillChartComponent;
  let fixture: ComponentFixture<SvmsLiquidFillChartComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SvmsLiquidFillChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsLiquidFillChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
