import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { CreateBackgroundCheckComponent } from './create-background-check.component';

describe('CreateBackgroundCheckComponent', () => {
  let component: CreateBackgroundCheckComponent;
  let fixture: ComponentFixture<CreateBackgroundCheckComponent>;
  CommonTestingModule.setUpTestBed(CreateBackgroundCheckComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateBackgroundCheckComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateBackgroundCheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
