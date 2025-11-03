import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { VendorBasicInfoComponent } from './vendor-basic-info.component';

describe('VendorBasicInfoComponent', () => {
  let component: VendorBasicInfoComponent;
  let fixture: ComponentFixture<VendorBasicInfoComponent>;
  CommonTestingModule.setUpTestBed(VendorBasicInfoComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        ReactiveFormsModule,
        HttpClientModule,
        FormsModule
      ],
      declarations: [VendorBasicInfoComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VendorBasicInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
