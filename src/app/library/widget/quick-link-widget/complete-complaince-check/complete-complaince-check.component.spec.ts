import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CompleteComplainceCheckComponent } from './complete-complaince-check.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('CompleteComplainceCheckComponent', () => {
  let component: CompleteComplainceCheckComponent;
  let fixture: ComponentFixture<CompleteComplainceCheckComponent>;
  CommonTestingModule.setUpTestBed(CompleteComplainceCheckComponent);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CompleteComplainceCheckComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompleteComplainceCheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
