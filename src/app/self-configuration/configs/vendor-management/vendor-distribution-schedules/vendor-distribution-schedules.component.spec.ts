import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VendorDistributionSchedulesComponent } from './vendor-distribution-schedules.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('VendorDistributionSchedulesComponent', () => {
  let component: VendorDistributionSchedulesComponent;
  let fixture: ComponentFixture<VendorDistributionSchedulesComponent>;
  CommonTestingModule.setUpTestBed(VendorDistributionSchedulesComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(VendorDistributionSchedulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
