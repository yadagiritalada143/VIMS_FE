import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SvmsPieChartComponent } from './svms-pie-chart.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('SvmsPieChartComponent', () => {
  let component: SvmsPieChartComponent;
  let fixture: ComponentFixture<SvmsPieChartComponent>;
  CommonTestingModule.setUpTestBed(SvmsPieChartComponent);
  
  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsPieChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
