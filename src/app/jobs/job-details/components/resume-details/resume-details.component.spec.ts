import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { ResumeDetailsComponent } from './resume-details.component';

describe('ResumeDetailsComponent', () => {
  let component: ResumeDetailsComponent;
  let fixture: ComponentFixture<ResumeDetailsComponent>;
  CommonTestingModule.setUpTestBed(ResumeDetailsComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ResumeDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ResumeDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
