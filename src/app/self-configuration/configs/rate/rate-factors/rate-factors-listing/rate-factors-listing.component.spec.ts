import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RateFactorsListingComponent } from './rate-factors-listing.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('RateFactorsListingComponent', () => {
  let component: RateFactorsListingComponent;
  let fixture: ComponentFixture<RateFactorsListingComponent>;
  CommonTestingModule.setUpTestBed(RateFactorsListingComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(RateFactorsListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
