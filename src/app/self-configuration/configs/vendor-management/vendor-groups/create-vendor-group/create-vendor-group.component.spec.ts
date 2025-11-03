import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateVendorGroupComponent } from './create-vendor-group.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('CreateVendorGroupComponent', () => {
  let component: CreateVendorGroupComponent;
  let fixture: ComponentFixture<CreateVendorGroupComponent>;
  CommonTestingModule.setUpTestBed(CreateVendorGroupComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateVendorGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
