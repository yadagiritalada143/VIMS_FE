import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VendorComplianceDocumentGroupsCreateComponent } from './vendor-compliance-document-groups-create.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('VendorComplianceDocumentGroupsCreateComponent', () => {
  let component: VendorComplianceDocumentGroupsCreateComponent;
  let fixture: ComponentFixture<VendorComplianceDocumentGroupsCreateComponent>;
  CommonTestingModule.setUpTestBed(VendorComplianceDocumentGroupsCreateComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(VendorComplianceDocumentGroupsCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
