import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SvmsSpiralChartComponent } from './svms-spiral-chart.component';

describe('SvmsSpiralChartComponent', () => {
  let component: SvmsSpiralChartComponent;
  let fixture: ComponentFixture<SvmsSpiralChartComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SvmsSpiralChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsSpiralChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
