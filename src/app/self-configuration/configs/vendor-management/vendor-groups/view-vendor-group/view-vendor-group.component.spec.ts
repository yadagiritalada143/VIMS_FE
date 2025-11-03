import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewVendorGroupComponent } from './view-vendor-group.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('ViewVendorGroupComponent', () => {
  let component: ViewVendorGroupComponent;
  let fixture: ComponentFixture<ViewVendorGroupComponent>;
  CommonTestingModule.setUpTestBed(ViewVendorGroupComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewVendorGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
