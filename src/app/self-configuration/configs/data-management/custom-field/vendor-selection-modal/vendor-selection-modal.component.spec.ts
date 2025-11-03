import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { VendorSelectionModalComponent } from './vendor-selection-modal.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('VendorSelectionModalComponent', () => {
  let component: VendorSelectionModalComponent;
  let fixture: ComponentFixture<VendorSelectionModalComponent>;
  CommonTestingModule.setUpTestBed(VendorSelectionModalComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(VendorSelectionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
