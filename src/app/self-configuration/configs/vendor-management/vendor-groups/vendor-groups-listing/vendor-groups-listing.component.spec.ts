import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VendorGroupsListingComponent } from './vendor-groups-listing.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('VendorGroupsListingComponent', () => {
  let component: VendorGroupsListingComponent;
  let fixture: ComponentFixture<VendorGroupsListingComponent>;
  CommonTestingModule.setUpTestBed(VendorGroupsListingComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(VendorGroupsListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
