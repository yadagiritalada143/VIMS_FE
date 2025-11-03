import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { VendorGroupListComponent } from './vendor-group-list.component';

describe('VendorGroupListComponent', () => {
  let component: VendorGroupListComponent;
  let fixture: ComponentFixture<VendorGroupListComponent>;
  CommonTestingModule.setUpTestBed(VendorGroupListComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ VendorGroupListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VendorGroupListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
