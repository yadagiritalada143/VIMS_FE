import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { createVendorUserComponent } from './add-user.component';

describe('AddUserComponent', () => {
  let component: createVendorUserComponent;
  let fixture: ComponentFixture<createVendorUserComponent>;
  CommonTestingModule.setUpTestBed(createVendorUserComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [createVendorUserComponent]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(createVendorUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
