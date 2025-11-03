import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { VendorComplianceDocumentsViewComponent } from './vendor-compliance-documents-view.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('VendorComplianceDocumentsViewComponent', () => {
  let component: VendorComplianceDocumentsViewComponent;
  let fixture: ComponentFixture<VendorComplianceDocumentsViewComponent>;
  CommonTestingModule.setUpTestBed(VendorComplianceDocumentsViewComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(VendorComplianceDocumentsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
