import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { CredentialingBackgroundCheckComponent } from './credentialing-background-check.component';

describe('CredentialingBackgroundCheckComponent', () => {
  let component: CredentialingBackgroundCheckComponent;
  let fixture: ComponentFixture<CredentialingBackgroundCheckComponent>;
  CommonTestingModule.setUpTestBed(CredentialingBackgroundCheckComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CredentialingBackgroundCheckComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CredentialingBackgroundCheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
