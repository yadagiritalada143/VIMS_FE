import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { WelcomeOnboardComponent } from './welcome-onboard.component';

describe('WelcomeOnboardComponent', () => {
  let component: WelcomeOnboardComponent;
  let fixture: ComponentFixture<WelcomeOnboardComponent>;
  CommonTestingModule.setUpTestBed(WelcomeOnboardComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ WelcomeOnboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WelcomeOnboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
