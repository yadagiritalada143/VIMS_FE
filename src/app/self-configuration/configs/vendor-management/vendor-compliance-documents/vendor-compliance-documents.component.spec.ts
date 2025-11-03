import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VendorComplianceDocumentsComponent } from './vendor-compliance-documents.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('VendorComplianceDocumentsComponent', () => {
  let component: VendorComplianceDocumentsComponent;
  let fixture: ComponentFixture<VendorComplianceDocumentsComponent>;
  CommonTestingModule.setUpTestBed(VendorComplianceDocumentsComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(VendorComplianceDocumentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
