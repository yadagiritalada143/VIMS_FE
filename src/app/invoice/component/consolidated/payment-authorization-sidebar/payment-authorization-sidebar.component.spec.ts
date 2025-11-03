import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PaymentAuthorizationSidebarComponent } from './payment-authorization-sidebar.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('PaymentAuthorizationSidebarComponent', () => {
  let component: PaymentAuthorizationSidebarComponent;
  let fixture: ComponentFixture<PaymentAuthorizationSidebarComponent>;
  CommonTestingModule.setUpTestBed(PaymentAuthorizationSidebarComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentAuthorizationSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
