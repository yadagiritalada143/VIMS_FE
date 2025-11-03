import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VendorComplianceListComponent } from './vendor-compliance-list.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('VendorComplianceListComponent', () => {
  let component: VendorComplianceListComponent;
  let fixture: ComponentFixture<VendorComplianceListComponent>;
  CommonTestingModule.setUpTestBed(VendorComplianceListComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(VendorComplianceListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
