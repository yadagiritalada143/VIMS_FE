import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AccountSetupComponent } from './account-setup.component';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AccountServiceMock } from './account.service.mock';
describe('AccountSetupIntroComponent', () => {
  let component: AccountSetupComponent;
  let fixture: ComponentFixture<AccountSetupComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AccountSetupComponent],
      imports: [RouterModule.forRoot([], { relativeLinkResolution: 'legacy' }), HttpClientModule],
      providers: [{ provide: AccountServiceMock }]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AccountSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
