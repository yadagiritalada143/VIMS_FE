import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { VendorDsListComponent } from './vendor-ds-list.component';

describe('VendorDsListComponent', () => {
  let component: VendorDsListComponent;
  let fixture: ComponentFixture<VendorDsListComponent>;
  CommonTestingModule.setUpTestBed(VendorDsListComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ VendorDsListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VendorDsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
