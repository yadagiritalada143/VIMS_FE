import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { VendorComplianceDocumentsCreateComponent } from './vendor-compliance-documents-create.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('VendorComplianceDocumentsCreateComponent', () => {
  let component: VendorComplianceDocumentsCreateComponent;
  let fixture: ComponentFixture<VendorComplianceDocumentsCreateComponent>;
  CommonTestingModule.setUpTestBed(VendorComplianceDocumentsCreateComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(VendorComplianceDocumentsCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
