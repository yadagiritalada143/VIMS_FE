import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FlowDetailedListingComponent } from './flow-detailed-listing.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('FlowDetailedListingComponent', () => {
  let component: FlowDetailedListingComponent;
  let fixture: ComponentFixture<FlowDetailedListingComponent>;
  CommonTestingModule.setUpTestBed(FlowDetailedListingComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(FlowDetailedListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
