import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { CreateVendorGroupComponent } from './create-vendor-group.component';

describe('CreateVendorGroupComponent', () => {
  let component: CreateVendorGroupComponent;
  let fixture: ComponentFixture<CreateVendorGroupComponent>;
  CommonTestingModule.setUpTestBed(CreateVendorGroupComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateVendorGroupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateVendorGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
