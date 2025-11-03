import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VendorComplianceDocumentGroupsComponent } from './vendor-compliance-document-groups.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('VendorComplianceDocumentGroupsComponent', () => {
  let component: VendorComplianceDocumentGroupsComponent;
  let fixture: ComponentFixture<VendorComplianceDocumentGroupsComponent>;
  CommonTestingModule.setUpTestBed(VendorComplianceDocumentGroupsComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(VendorComplianceDocumentGroupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
