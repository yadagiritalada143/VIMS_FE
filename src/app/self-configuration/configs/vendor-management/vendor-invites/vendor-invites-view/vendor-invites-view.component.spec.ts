import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { VendorInvitesViewComponent } from './vendor-invites-view.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('VendorInvitesViewComponent', () => {
  let component: VendorInvitesViewComponent;
  let fixture: ComponentFixture<VendorInvitesViewComponent>;
  CommonTestingModule.setUpTestBed(VendorInvitesViewComponent);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VendorInvitesViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VendorInvitesViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
