import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CreateJobChartComponent } from './create-job-chart.component';

describe('CreateJobChartComponent', () => {
  let component: CreateJobChartComponent;
  let fixture: ComponentFixture<CreateJobChartComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateJobChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateJobChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
