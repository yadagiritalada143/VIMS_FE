import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { CreateVendorScheduleComponent } from './create-vendor-schedule.component';

describe('CreateVendorScheduleComponent', () => {
  let component: CreateVendorScheduleComponent;
  let fixture: ComponentFixture<CreateVendorScheduleComponent>;
  CommonTestingModule.setUpTestBed(CreateVendorScheduleComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateVendorScheduleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateVendorScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
