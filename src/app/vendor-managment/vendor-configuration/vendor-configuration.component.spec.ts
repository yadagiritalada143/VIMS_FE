import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { VendorConfigurationComponent } from './vendor-configuration.component';

describe('VendorConfigurationComponent', () => {
  let component: VendorConfigurationComponent;
  let fixture: ComponentFixture<VendorConfigurationComponent>;
  CommonTestingModule.setUpTestBed(VendorConfigurationComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ VendorConfigurationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VendorConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
