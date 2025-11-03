import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SvmsColumnChartComponent } from './svms-column-chart.component';

describe('SvmsColumnChartComponent', () => {
  let component: SvmsColumnChartComponent;
  let fixture: ComponentFixture<SvmsColumnChartComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SvmsColumnChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsColumnChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
