import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SvmsBubbleChartComponent } from './svms-bubble-chart.component';

describe('SvmsBubbleChartComponent', () => {
  let component: SvmsBubbleChartComponent;
  let fixture: ComponentFixture<SvmsBubbleChartComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SvmsBubbleChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsBubbleChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
