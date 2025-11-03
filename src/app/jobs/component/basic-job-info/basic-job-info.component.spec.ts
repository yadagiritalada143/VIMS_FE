import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { BasicJobInfoComponent } from './basic-job-info.component';

describe('BasicJobInfoComponent', () => { 
  let component: BasicJobInfoComponent;
  let fixture: ComponentFixture<BasicJobInfoComponent>;
  CommonTestingModule.setUpTestBed(BasicJobInfoComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BasicJobInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BasicJobInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
