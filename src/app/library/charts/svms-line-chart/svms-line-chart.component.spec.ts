import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SvmsLineChartComponent } from './svms-line-chart.component';

describe('SvmsLineChartComponent', () => {
  let component: SvmsLineChartComponent;
  let fixture: ComponentFixture<SvmsLineChartComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SvmsLineChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsLineChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
