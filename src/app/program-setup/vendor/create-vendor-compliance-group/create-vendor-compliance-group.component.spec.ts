import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { CreateVendorComplianceGroupComponent } from './create-vendor-compliance-group.component';


describe('CreateVendorComplianceGroupComponent', () => {
  let component: CreateVendorComplianceGroupComponent;
  let fixture: ComponentFixture<CreateVendorComplianceGroupComponent>;
  CommonTestingModule.setUpTestBed(CreateVendorComplianceGroupComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateVendorComplianceGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
