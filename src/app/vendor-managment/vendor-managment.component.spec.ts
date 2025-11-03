import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { VendorManagmentComponent } from './vendor-managment.component';

describe('VendorManagmentComponent', () => {
  let component: VendorManagmentComponent;
  let fixture: ComponentFixture<VendorManagmentComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ VendorManagmentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VendorManagmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
