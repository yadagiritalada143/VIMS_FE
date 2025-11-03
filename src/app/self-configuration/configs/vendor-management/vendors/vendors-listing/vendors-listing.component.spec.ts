import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VendorsListingComponent } from './vendors-listing.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('VendorsListingComponent', () => {
  let component: VendorsListingComponent;
  let fixture: ComponentFixture<VendorsListingComponent>;
  CommonTestingModule.setUpTestBed(VendorsListingComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(VendorsListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
