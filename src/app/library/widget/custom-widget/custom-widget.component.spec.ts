import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CustomWidgetComponent } from './custom-widget.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('CustomWidgetComponent', () => {
  let component: CustomWidgetComponent;
  let fixture: ComponentFixture<CustomWidgetComponent>;
  CommonTestingModule.setUpTestBed(CustomWidgetComponent);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CustomWidgetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
