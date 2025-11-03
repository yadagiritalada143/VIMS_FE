import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { VendorComplianceListComponent } from './vendor-compliance-list.component';

describe('VendorComplianceListComponent', () => {
  let component: VendorComplianceListComponent;
  let fixture: ComponentFixture<VendorComplianceListComponent>;
  CommonTestingModule.setUpTestBed(VendorComplianceListComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ VendorComplianceListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VendorComplianceListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
