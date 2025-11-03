import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { VendorOnboardComponent } from './vendor-onboard.component';

describe('VendorOnboardComponent', () => {
  let component: VendorOnboardComponent;
  let fixture: ComponentFixture<VendorOnboardComponent>;
  CommonTestingModule.setUpTestBed(VendorOnboardComponent);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ VendorOnboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VendorOnboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
