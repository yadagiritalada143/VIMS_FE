import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { SupportFlyoutComponent } from './support-flyout.component';

describe('SupportFlyoutComponent', () => {
  let component: SupportFlyoutComponent;
  let fixture: ComponentFixture<SupportFlyoutComponent>;
  CommonTestingModule.setUpTestBed(SupportFlyoutComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({ 
      declarations: [ SupportFlyoutComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SupportFlyoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
