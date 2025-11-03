import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VendorInvitesComponent } from './vendor-invites.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('VendorInvitesComponent', () => {
  let component: VendorInvitesComponent;
  let fixture: ComponentFixture<VendorInvitesComponent>;
  CommonTestingModule.setUpTestBed(VendorInvitesComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(VendorInvitesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
