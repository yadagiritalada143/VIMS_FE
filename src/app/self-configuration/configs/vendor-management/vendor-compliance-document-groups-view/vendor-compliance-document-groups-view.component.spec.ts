import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VendorComplianceDocumentGroupsViewComponent } from './vendor-compliance-document-groups-view.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('VendorComplianceDocumentGroupsViewComponent', () => {
  let component: VendorComplianceDocumentGroupsViewComponent;
  let fixture: ComponentFixture<VendorComplianceDocumentGroupsViewComponent>;
  CommonTestingModule.setUpTestBed(VendorComplianceDocumentGroupsViewComponent);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VendorComplianceDocumentGroupsViewComponent ]
    })
    .compileComponents();
  });


  beforeEach(() => {
    fixture = TestBed.createComponent(VendorComplianceDocumentGroupsViewComponent);
    component = fixture.componentInstance;
    component.description= "This is a test description";
    component.selectedDocument=[];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
