import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SvmsPieMiniChartComponent } from './svms-pie-mini-chart.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('SvmsPieChartComponent', () => {
  let component: SvmsPieMiniChartComponent;
  let fixture: ComponentFixture<SvmsPieMiniChartComponent>;
  CommonTestingModule.setUpTestBed(SvmsPieMiniChartComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsPieMiniChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
