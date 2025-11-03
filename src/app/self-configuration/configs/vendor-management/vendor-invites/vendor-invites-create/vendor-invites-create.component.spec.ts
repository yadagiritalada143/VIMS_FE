import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { VendorInvitesCreateComponent } from './vendor-invites-create.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('VendorInvitesCreateComponent', () => {
  let component: VendorInvitesCreateComponent;
  let fixture: ComponentFixture<VendorInvitesCreateComponent>;
  CommonTestingModule.setUpTestBed(VendorInvitesCreateComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(VendorInvitesCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
