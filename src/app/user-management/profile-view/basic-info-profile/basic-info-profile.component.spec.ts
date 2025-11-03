import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { BasicInfoProfileComponent } from './basic-info-profile.component';

describe('BasicInfoProfileComponent', () => {
  let component: BasicInfoProfileComponent;
  let fixture: ComponentFixture<BasicInfoProfileComponent>;
  CommonTestingModule.setUpTestBed(BasicInfoProfileComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [BasicInfoProfileComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BasicInfoProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
